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

    /* ================= Helpers ================= */

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
        if (p < 0) p = 0;
        if (p > 100) p = 100;
        return Math.Round(p, 2);
    }

    /* ================= GET Endpoints ================= */

    // "My reading list" (krejt tracking)
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

    // "Currently reading"
    public async Task<List<ReadingDto>> GetCurrentAsync(int userId)
    {
        var list = await _context.UserBooks
            .Where(ub => ub.UserId == userId && ub.Status == "Reading")
            .OrderByDescending(ub => ub.LastUpdated)
            .ToListAsync();

        return list.Select(ToDto).ToList();
    }

    // "Finished"
    public async Task<List<ReadingDto>> GetFinishedAsync(int userId)
    {
        var list = await _context.UserBooks
            .Where(ub => ub.UserId == userId && ub.Status == "Finished")
            .OrderByDescending(ub => ub.LastUpdated)
            .ToListAsync();

        return list.Select(ToDto).ToList();
    }

    /* ================= START / PROGRESS / FINISH ================= */

    // Start reading (one per user+book, prevent duplicates)
    public async Task<ReadingDto> StartAsync(int userId, StartReadingDto dto)
{
    if (dto.TotalPages <= 0)
        throw new ArgumentException("TotalPages must be > 0");

    // gjeje nëse ekziston UserBook për këtë user+book
    var ub = await _context.UserBooks
        .FirstOrDefaultAsync(x => x.UserId == userId && x.BookId == dto.BookId);

    // ✅ nëse s’ekziston, krijoje
    if (ub == null)
    {
        ub = new UserBook
        {
            UserId = userId,
            BookId = dto.BookId,
            Status = "Reading",
            TotalPages = dto.TotalPages,
            PagesRead = 0,
            Percent = 0,
            StartedAt = DateTime.UtcNow,
            LastUpdated = DateTime.UtcNow
        };

        _context.UserBooks.Add(ub);
        await _context.SaveChangesAsync();
        return ToDto(ub);
    }

    // ✅ nëse ekziston (p.sh. "to-read"), mos e kthe error — veç nis leximin
    if (ub.TotalPages <= 0)
        ub.TotalPages = dto.TotalPages;

    // nëse është Finished, mundesh me vendos rregull:
    // - ose mos lejo restart
    // - ose lejo restart duke resetu pagesRead
    if (ub.Status == "Finished")
        throw new InvalidOperationException("This book is already finished.");

    ub.Status = "Reading";
    ub.StartedAt = ub.StartedAt == default ? DateTime.UtcNow : ub.StartedAt;
    ub.LastUpdated = DateTime.UtcNow;

    await _context.SaveChangesAsync();
    return ToDto(ub);
}


    // Update progress: pages read / percent / lastUpdated
    public async Task<bool> UpdateProgressAsync(int id, int userId, UpdateProgressDto dto)
    {
        var ub = await _context.UserBooks
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);

        if (ub == null) return false;

        ValidateProgress(ub, dto.PagesRead);

        ub.PagesRead = dto.PagesRead;
        ub.Percent = CalcPercent(ub.PagesRead, ub.TotalPages);
        ub.LastUpdated = DateTime.UtcNow;

        // auto mark finished when 100% or pages==total
        if (ub.PagesRead == ub.TotalPages || ub.Percent >= 100)
            ub.Status = "Finished";
        else
            ub.Status = "Reading";

        await _context.SaveChangesAsync();
        return true;
    }

    // Mark as finished
    public async Task<bool> MarkFinishedAsync(int id, int userId)
    {
        var ub = await _context.UserBooks
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);

        if (ub == null) return false;

        if (ub.TotalPages <= 0)
            throw new ArgumentException("TotalPages must be > 0");

        ub.PagesRead = ub.TotalPages;
        ub.Percent = 100;
        ub.Status = "Finished";
        ub.LastUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    /* ================= OPTIONAL: keep your old CRUD ================= */

    // Keep UpdateAsync for status if you still need it (optional)
    public async Task<bool> UpdateAsync(int id, int userId, UpdateReadingDto dto)
    {
        var ub = await _context.UserBooks
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);

        if (ub == null) return false;

        ub.Status = dto.Status;
        ub.LastUpdated = DateTime.UtcNow;

        // if manually set finished, enforce 100%
        if (ub.Status == "Finished" && ub.TotalPages > 0)
        {
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
