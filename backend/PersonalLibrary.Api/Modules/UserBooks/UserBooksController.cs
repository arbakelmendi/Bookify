using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalLibrary.Api.Data;
using PersonalLibrary.Api.Models;
using PersonalLibrary.Api.Modules.UserBooks.Dtos;

namespace PersonalLibrary.Api.Modules.UserBooks;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserBooksController : ControllerBase
{
    private readonly AppDbContext _db;

    public UserBooksController(AppDbContext db)
    {
        _db = db;
    }

    // ✅ FIX: fallback edhe te "sub" (si ReadingController)
    private int GetUserId()
    {
        var idStr =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        if (string.IsNullOrWhiteSpace(idStr))
            throw new Exception("Missing user id claim");

        return int.Parse(idStr);
    }

    private bool IsAdmin()
        => (User.FindFirstValue(ClaimTypes.Role) ?? "")
            .Equals("admin", StringComparison.OrdinalIgnoreCase);

    // GET: /api/UserBooks
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? userId = null)
    {
        var meId = GetUserId();

        int targetUserId;
        if (IsAdmin() && userId.HasValue) targetUserId = userId.Value;
        else targetUserId = meId;

        var data = await _db.UserBooks
            .AsNoTracking()
            .Where(ub => ub.UserId == targetUserId)
            .Include(ub => ub.Book)
            .OrderByDescending(ub => ub.Id)
            .Select(ub => new UserBookDto
            {
                Id = ub.Id,
                UserId = ub.UserId,
                BookId = ub.BookId,
                Status = ub.Status,
                CurrentPage = ub.CurrentPage,
                PagesRead = ub.PagesRead,
                TotalPages = ub.TotalPages,
                Percent = ub.Percent,
                LastUpdated = ub.LastUpdated,

                Title = ub.Book!.Title,
                Author = ub.Book.Author,
                Description = ub.Book.Description,
                CoverImageUrl = ub.Book.CoverImageUrl,
                Year = ub.Book.Year
            })
            .ToListAsync();

        return Ok(data);
    }

    // POST: /api/UserBooks
    [HttpPost]
    public async Task<IActionResult> Add([FromBody] AddUserBookDto dto)
    {
        var userId = GetUserId();

        var bookExists = await _db.Books.AnyAsync(b => b.Id == dto.BookId);
        if (!bookExists) return NotFound($"Book with id {dto.BookId} not found");

        var existing = await _db.UserBooks
            .FirstOrDefaultAsync(x => x.UserId == userId && x.BookId == dto.BookId);

        if (existing != null)
        {
            existing.Status = dto.Status;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Book already exists in library. Status updated." });
        }

        var userBook = new UserBook
        {
            UserId = userId,
            BookId = dto.BookId,
            Status = dto.Status
        };

        _db.UserBooks.Add(userBook);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetByBookId), new { bookId = dto.BookId }, new { userBook.Id });
    }

    // GET: /api/UserBooks/book/{bookId}
    [HttpGet("book/{bookId:int}")]
    public async Task<IActionResult> GetByBookId(int bookId)
    {
        var userId = GetUserId();

        var ub = await _db.UserBooks
            .AsNoTracking()
            .Include(x => x.Book)
            .FirstOrDefaultAsync(x => x.UserId == userId && x.BookId == bookId);

        if (ub == null) return NotFound();

        var dto = new UserBookDto
        {
            Id = ub.Id,
            UserId = ub.UserId,
            BookId = ub.BookId,
            Status = ub.Status,
            CurrentPage = ub.CurrentPage,
            PagesRead = ub.PagesRead,
            TotalPages = ub.TotalPages,
            Percent = ub.Percent,
            LastUpdated = ub.LastUpdated,
            Title = ub.Book!.Title,
            Author = ub.Book.Author,
            Description = ub.Book.Description,
            CoverImageUrl = ub.Book.CoverImageUrl,
            Year = ub.Book.Year
        };

        return Ok(dto);
    }

    // PUT: /api/UserBooks/book/{bookId}/status
    [HttpPut("book/{bookId:int}/status")]
    public async Task<IActionResult> UpdateStatus(int bookId, [FromBody] UpdateUserBookStatusDto dto)
    {
        var userId = GetUserId();

        var ub = await _db.UserBooks
            .FirstOrDefaultAsync(x => x.UserId == userId && x.BookId == bookId);

        if (ub == null) return NotFound("Book is not in your library.");

        var prevStatus = (ub.Status ?? string.Empty).Trim();
        var requested = (dto.Status ?? string.Empty).Trim().ToLowerInvariant();
        var newStatus = requested switch
        {
            "completed" or "finished" => "Finished",
            "planned" or "to-read" or "toread" or "to read" => "To Read",
            _ => "Reading"
        };

        var totalPages = ub.TotalPages;
        if (totalPages <= 0 && dto.TotalPages.HasValue && dto.TotalPages.Value > 0)
        {
            totalPages = dto.TotalPages.Value;
        }

        // Apply requested status first, then adjust progress based on transition.
        ub.Status = newStatus;

        if (newStatus == "Finished")
        {
            if (totalPages > 0)
            {
                ub.TotalPages = totalPages;
                ub.CurrentPage = totalPages;
                ub.PagesRead = totalPages;
                ub.Percent = 100;
            }
            else
            {
                ub.CurrentPage = Math.Max(ub.CurrentPage, 1);
                ub.PagesRead = Math.Max(ub.PagesRead, ub.CurrentPage);
                ub.Percent = 100;
            }
        }
        else if (newStatus == "To Read")
        {
            ub.CurrentPage = 1;
            ub.PagesRead = 0;
            ub.Percent = 0;
        }
        else
        {
            if (totalPages > 0)
            {
                ub.TotalPages = totalPages;
            }

            var prevWasFinished = prevStatus.Equals("Finished", StringComparison.OrdinalIgnoreCase) ||
                                  prevStatus.Equals("Completed", StringComparison.OrdinalIgnoreCase);

            if (newStatus == "Reading" && prevWasFinished && totalPages > 0)
            {
                // Finished -> Reading must keep user at the last page.
                ub.CurrentPage = totalPages;
            }
            else if (newStatus == "Reading" && (ub.CurrentPage <= 0))
            {
                ub.CurrentPage = dto.CurrentPage.HasValue && dto.CurrentPage.Value > 0
                    ? dto.CurrentPage.Value
                    : 1;
            }

            if (totalPages > 0)
            {
                ub.CurrentPage = Math.Clamp(ub.CurrentPage, 1, totalPages);
                ub.PagesRead = Math.Clamp(Math.Max(ub.PagesRead, ub.CurrentPage), 0, totalPages);
                ub.Percent = Math.Max(0, Math.Round((ub.PagesRead * 100.0) / totalPages));
            }
            else
            {
                ub.PagesRead = Math.Max(ub.PagesRead, 0);
                ub.Percent = Math.Max(ub.Percent, 0);
            }
        }

        ub.LastUpdated = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var updated = await _db.UserBooks
            .AsNoTracking()
            .Include(x => x.Book)
            .Where(x => x.UserId == userId && x.BookId == bookId)
            .Select(x => new UserBookDto
            {
                Id = x.Id,
                UserId = x.UserId,
                BookId = x.BookId,
                Status = x.Status,
                CurrentPage = x.CurrentPage,
                PagesRead = x.PagesRead,
                TotalPages = x.TotalPages,
                Percent = x.Percent,
                LastUpdated = x.LastUpdated,
                Title = x.Book!.Title,
                Author = x.Book.Author,
                Description = x.Book.Description,
                CoverImageUrl = x.Book.CoverImageUrl,
                Year = x.Book.Year
            })
            .FirstOrDefaultAsync();

        if (updated == null)
            return NotFound("Book is not in your library.");

        return Ok(updated);
    }

    // DELETE: /api/UserBooks/book/{bookId}
    [HttpDelete("book/{bookId:int}")]
    public async Task<IActionResult> Remove(int bookId)
    {
        var userId = GetUserId();

        var ub = await _db.UserBooks
            .FirstOrDefaultAsync(x => x.UserId == userId && x.BookId == bookId);

        if (ub == null) return NotFound("Book is not in your library.");

        _db.UserBooks.Remove(ub);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
