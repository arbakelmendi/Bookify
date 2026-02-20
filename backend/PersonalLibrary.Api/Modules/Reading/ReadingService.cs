using Microsoft.EntityFrameworkCore;
using PersonalLibrary.Api.Data;
using PersonalLibrary.Api.Models;
using PersonalLibrary.Api.Modules.Reading.Dtos;

namespace PersonalLibrary.Api.Modules.Reading;

public class ReadingService
{
    private readonly AppDbContext _context;

    public ReadingService(AppDbContext context)
    {
        _context = context;
    }

    private static ReadingDto ToDto(UserBook ub) =>
        new(
            ub.Id,
            ub.UserId,
            ub.BookId,
            ub.Status,
            ub.TotalPages,
            ub.PagesRead,
            ub.Percent,
            ub.StartedAt,
            ub.LastUpdated
        );

    private static PdfProgressViewDto ToPdfProgressDto(UserBook ub) =>
        new(
            ub.BookId,
            ub.Id,
            ub.CurrentPage,
            ub.TotalPages,
            ub.PagesRead,
            ub.Percent,
            ub.Status,
            ub.LastUpdated
        );

    private static void ValidateProgress(UserBook ub, int pagesRead)
    {
        if (ub.TotalPages <= 0)
            throw new ArgumentException("TotalPages must be > 0");

        if (pagesRead < 0)
            throw new ArgumentException("PagesRead must be >= 0");

        if (pagesRead > ub.TotalPages)
            throw new ArgumentException("PagesRead cannot exceed TotalPages");
    }

    private static double CalcPercent(int pagesRead, int totalPages)
    {
        if (totalPages <= 0) return 0;
        var p = (double)pagesRead / totalPages * 100.0;
        p = Math.Clamp(p, 0, 100);
        return Math.Round(p, 0);
    }

    private static string NormalizeStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return "Reading";

        var s = status.Trim().ToLowerInvariant();
        return s switch
        {
            "reading" => "Reading",
            "finished" => "Finished",
            "planned" => "Planned",
            "toread" => "ToRead",
            "to-read" => "ToRead",
            _ => "Reading"
        };
    }

    private static int ClampCurrentPage(int value, int totalPages)
    {
        if (totalPages <= 0) return 1;
        if (value < 1) return 1;
        if (value > totalPages) return totalPages;
        return value;
    }

    public async Task<List<ReadingDto>> GetAllAsync(int userId)
    {
        var list = await _context.UserBooks
            .Where(ub => ub.UserId == userId)
            .OrderByDescending(ub => ub.LastUpdated)
            .ToListAsync();

        return list.Select(ToDto).ToList();
    }

    public async Task<ReadingDto?> GetByIdAsync(int id, int userId)
    {
        var ub = await _context.UserBooks
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);

        return ub == null ? null : ToDto(ub);
    }

    public async Task<List<ReadingDto>> GetCurrentAsync(int userId)
    {
        var list = await _context.UserBooks
            .Where(ub => ub.UserId == userId && (ub.Status == "Reading" || ub.PagesRead > 0 || ub.CurrentPage > 1))
            .OrderByDescending(ub => ub.LastUpdated)
            .ToListAsync();

        return list.Select(ToDto).ToList();
    }

    public async Task<List<ReadingDto>> GetFinishedAsync(int userId)
    {
        var list = await _context.UserBooks
            .Where(ub => ub.UserId == userId && ub.Status == "Finished")
            .OrderByDescending(ub => ub.LastUpdated)
            .ToListAsync();

        return list.Select(ToDto).ToList();
    }

    public async Task<PdfProgressViewDto?> GetPdfProgressAsync(int userId, int bookId)
    {
        var ub = await _context.UserBooks
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId && x.BookId == bookId);

        return ub == null ? null : ToPdfProgressDto(ub);
    }

    public async Task<(bool created, PdfProgressViewDto? dto, bool missingTotalPages)> UpsertPdfProgressAsync(
        int userId,
        int bookId,
        UpdatePdfProgressDto dto)
    {
        var ub = await _context.UserBooks
            .FirstOrDefaultAsync(x => x.UserId == userId && x.BookId == bookId);

        var now = DateTime.UtcNow;
        var normalizedStatus = NormalizeStatus(dto.Status);

        if (ub == null)
        {
            if (!dto.TotalPages.HasValue || dto.TotalPages.Value <= 0)
            {
                return (false, null, true);
            }

            var totalPages = dto.TotalPages.Value;
            var currentPage = ClampCurrentPage(dto.CurrentPage, totalPages);

            ub = new UserBook
            {
                UserId = userId,
                BookId = bookId,
                Status = currentPage <= 1 ? "ToRead" : "Reading",
                TotalPages = totalPages,
                CurrentPage = currentPage,
                PagesRead = currentPage,
                Percent = CalcPercent(currentPage, totalPages),
                StartedAt = now,
                LastUpdated = now
            };

            _context.UserBooks.Add(ub);
            await _context.SaveChangesAsync();
            return (true, ToPdfProgressDto(ub), false);
        }

        if (dto.TotalPages.HasValue && dto.TotalPages.Value > 0)
        {
            ub.TotalPages = dto.TotalPages.Value;
        }

        if (ub.TotalPages <= 0)
        {
            return (false, null, true);
        }

        ub.CurrentPage = ub.TotalPages > 0
            ? ClampCurrentPage(dto.CurrentPage, ub.TotalPages)
            : Math.Max(dto.CurrentPage, 1);
        ub.PagesRead = ub.TotalPages > 0
            ? Math.Clamp(ub.CurrentPage, 0, ub.TotalPages)
            : ub.CurrentPage;
        ub.Percent = ub.TotalPages > 0 ? CalcPercent(ub.PagesRead, ub.TotalPages) : 0;
        ub.LastUpdated = now;

        if (ub.CurrentPage >= ub.TotalPages && ub.TotalPages > 0)
        {
            ub.Status = "Finished";
        }
        else if (ub.CurrentPage > 1 && (ub.TotalPages <= 0 || ub.CurrentPage < ub.TotalPages))
        {
            ub.Status = "Reading";
        }
        else if (ub.CurrentPage <= 1 && string.IsNullOrWhiteSpace(dto.Status))
        {
            ub.Status = "ToRead";
        }
        else if (!string.IsNullOrWhiteSpace(dto.Status))
        {
            ub.Status = normalizedStatus;
        }

        await _context.SaveChangesAsync();
        return (false, ToPdfProgressDto(ub), false);
    }

    public async Task<ReadingDto> StartAsync(int userId, StartReadingDto dto)
    {
        if (dto.TotalPages <= 0)
            throw new ArgumentException("TotalPages must be > 0");

        var ub = await _context.UserBooks
            .FirstOrDefaultAsync(x => x.UserId == userId && x.BookId == dto.BookId);

        if (ub == null)
        {
            ub = new UserBook
            {
                UserId = userId,
                BookId = dto.BookId,
                Status = "Reading",
                TotalPages = dto.TotalPages,
                CurrentPage = 1,
                PagesRead = 0,
                Percent = 0,
                StartedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };

            _context.UserBooks.Add(ub);
            await _context.SaveChangesAsync();
            return ToDto(ub);
        }

        if (ub.TotalPages <= 0)
            ub.TotalPages = dto.TotalPages;

        if (ub.Status == "Finished")
            throw new InvalidOperationException("This book is already finished.");

        ub.Status = "Reading";
        ub.StartedAt = ub.StartedAt == default ? DateTime.UtcNow : ub.StartedAt;
        ub.LastUpdated = DateTime.UtcNow;
        ub.CurrentPage = ub.CurrentPage < 1 ? 1 : ub.CurrentPage;

        await _context.SaveChangesAsync();
        return ToDto(ub);
    }

    public async Task<bool> UpdateProgressAsync(int id, int userId, UpdateProgressDto dto)
    {
        var ub = await _context.UserBooks
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);

        if (ub == null) return false;

        ValidateProgress(ub, dto.PagesRead);

        ub.PagesRead = dto.PagesRead;
        ub.CurrentPage = ub.TotalPages > 0 ? Math.Clamp(Math.Max(1, dto.PagesRead), 1, ub.TotalPages) : 1;
        ub.Percent = CalcPercent(ub.PagesRead, ub.TotalPages);
        ub.LastUpdated = DateTime.UtcNow;

        if (ub.PagesRead == ub.TotalPages || ub.Percent >= 100)
            ub.Status = "Finished";
        else
            ub.Status = "Reading";

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> MarkFinishedAsync(int id, int userId)
    {
        var ub = await _context.UserBooks
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);

        if (ub == null) return false;

        if (ub.TotalPages <= 0)
            throw new ArgumentException("TotalPages must be > 0");

        ub.CurrentPage = ub.TotalPages;
        ub.PagesRead = ub.TotalPages;
        ub.Percent = 100;
        ub.Status = "Finished";
        ub.LastUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateAsync(int id, int userId, UpdateReadingDto dto)
    {
        var ub = await _context.UserBooks
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);

        if (ub == null) return false;

        ub.Status = dto.Status;
        ub.LastUpdated = DateTime.UtcNow;

        if (ub.Status == "Finished" && ub.TotalPages > 0)
        {
            ub.CurrentPage = ub.TotalPages;
            ub.PagesRead = ub.TotalPages;
            ub.Percent = 100;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var ub = await _context.UserBooks
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);

        if (ub == null) return false;

        _context.UserBooks.Remove(ub);
        await _context.SaveChangesAsync();
        return true;
    }
}
