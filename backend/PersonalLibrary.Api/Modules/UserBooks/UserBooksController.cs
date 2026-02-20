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

        var requested = (dto.Status ?? string.Empty).Trim().ToLowerInvariant();

        if (requested is "completed" or "finished")
        {
            ub.Status = "Finished";
            if (ub.TotalPages > 0)
            {
                ub.CurrentPage = ub.TotalPages;
                ub.PagesRead = ub.TotalPages;
                ub.Percent = 100;
            }
            else
            {
                // If total pages are unknown, keep status authoritative.
                ub.Percent = 100;
            }
        }
        else if (requested is "planned" or "to-read" or "toread" or "to read")
        {
            ub.Status = "To Read";
            ub.CurrentPage = 1;
            ub.PagesRead = 0;
            ub.Percent = 0;
        }
        else
        {
            ub.Status = "Reading";
            if (ub.TotalPages > 0)
            {
                ub.CurrentPage = Math.Clamp(ub.CurrentPage, 1, ub.TotalPages);
                ub.PagesRead = Math.Clamp(ub.CurrentPage, 0, ub.TotalPages);
                ub.Percent = (ub.PagesRead * 100.0) / ub.TotalPages;
            }
        }

        ub.LastUpdated = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return NoContent();
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
