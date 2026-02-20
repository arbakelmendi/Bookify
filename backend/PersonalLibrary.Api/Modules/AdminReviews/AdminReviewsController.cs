using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using PersonalLibrary.Api.Data;
using PersonalLibrary.Api.Models;
using PersonalLibrary.Api.Modules.AdminReviews.Dtos;

namespace PersonalLibrary.Api.Modules.AdminReviews;

[ApiController]
[Route("api/admin/reviews")]
[Authorize(Roles = "admin,Admin")]
public class AdminReviewsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminReviewsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search = null,
        [FromQuery] int? bookId = null,
        [FromQuery] int? userId = null,
        [FromQuery] int? minRating = null,
        [FromQuery] int? maxRating = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        if (page < 1) page = 1;
        if (pageSize != 10 && pageSize != 20 && pageSize != 50) pageSize = 10;

        var baseQuery =
            from rating in _db.BookRatings.AsNoTracking()
            join u in _db.Users.AsNoTracking() on rating.UserId equals u.Id
            join b in _db.Books.AsNoTracking() on rating.BookId equals b.Id
            select new
            {
                Rating = rating,
                User = u,
                Book = b
            };

        if (userId.HasValue)
            baseQuery = baseQuery.Where(x => x.Rating.UserId == userId.Value);

        if (bookId.HasValue)
            baseQuery = baseQuery.Where(x => x.Rating.BookId == bookId.Value);

        if (minRating.HasValue)
            baseQuery = baseQuery.Where(x => x.Rating.Value >= minRating.Value);

        if (maxRating.HasValue)
            baseQuery = baseQuery.Where(x => x.Rating.Value <= maxRating.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = $"%{search.Trim()}%";
            baseQuery = baseQuery.Where(x =>
                EF.Functions.Like(x.User.Username, s) ||
                EF.Functions.Like(x.User.Email, s) ||
                EF.Functions.Like(x.Book.Title, s) ||
                _db.BookReviews.Any(br =>
                    br.UserId == x.Rating.UserId &&
                    br.BookId == x.Rating.BookId &&
                    EF.Functions.Like(br.Text, s))
            );
        }

        var totalItems = await baseQuery.CountAsync();
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var items = await baseQuery
            .OrderByDescending(x => x.Rating.UpdatedAt ?? x.Rating.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new AdminReviewDto(
                x.Rating.Id,
                x.User.Id,
                x.User.Username,
                x.User.Email,
                x.Book.Id,
                x.Book.Title,
                x.Rating.Value,
                _db.BookReviews
                    .Where(br => br.UserId == x.User.Id && br.BookId == x.Book.Id)
                    .OrderByDescending(br => br.UpdatedAt ?? br.CreatedAt)
                    .ThenByDescending(br => br.Id)
                    .Select(br => br.Text)
                    .FirstOrDefault(),
                x.Rating.CreatedAt,
                _db.BookReviews
                    .Where(br => br.UserId == x.User.Id && br.BookId == x.Book.Id)
                    .OrderByDescending(br => br.UpdatedAt ?? br.CreatedAt)
                    .ThenByDescending(br => br.Id)
                    .Select(br => (DateTime?)(br.UpdatedAt ?? br.CreatedAt))
                    .FirstOrDefault() ?? x.Rating.UpdatedAt
            ))
            .ToListAsync();

        return Ok(new
        {
            items,
            page,
            pageSize,
            totalItems,
            totalPages
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var dto = await (
            from rating in _db.BookRatings.AsNoTracking()
            where rating.Id == id
            join u in _db.Users.AsNoTracking() on rating.UserId equals u.Id
            join b in _db.Books.AsNoTracking() on rating.BookId equals b.Id
            select new AdminReviewDto(
                rating.Id,
                rating.UserId,
                u.Username,
                u.Email,
                rating.BookId,
                b.Title,
                rating.Value,
                _db.BookReviews
                    .Where(br => br.UserId == rating.UserId && br.BookId == rating.BookId)
                    .OrderByDescending(br => br.UpdatedAt ?? br.CreatedAt)
                    .ThenByDescending(br => br.Id)
                    .Select(br => br.Text)
                    .FirstOrDefault(),
                rating.CreatedAt,
                _db.BookReviews
                    .Where(br => br.UserId == rating.UserId && br.BookId == rating.BookId)
                    .OrderByDescending(br => br.UpdatedAt ?? br.CreatedAt)
                    .ThenByDescending(br => br.Id)
                    .Select(br => (DateTime?)(br.UpdatedAt ?? br.CreatedAt))
                    .FirstOrDefault() ?? rating.UpdatedAt
            )
        ).FirstOrDefaultAsync();

        if (dto == null) return NotFound();
        return Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAdminReviewDto dto)
    {
        var userId = GetUserId();

        if (dto.Rating < 1 || dto.Rating > 5)
            return BadRequest("Rating must be between 1 and 5.");

        var userExists = await _db.Users.AnyAsync(u => u.Id == userId);
        if (!userExists) return NotFound("User not found.");

        var bookExists = await _db.Books.AnyAsync(b => b.Id == dto.BookId);
        if (!bookExists) return NotFound("Book not found.");

        var exists = await _db.BookRatings
            .AnyAsync(x => x.UserId == userId && x.BookId == dto.BookId);
        if (exists)
            return Conflict("A review for this user and book already exists.");

        var now = DateTime.UtcNow;

        var rating = new BookRating
        {
            UserId = userId,
            BookId = dto.BookId,
            Value = dto.Rating,
            CreatedAt = now
        };
        _db.BookRatings.Add(rating);

        if (!string.IsNullOrWhiteSpace(dto.Comment))
        {
            _db.BookReviews.Add(new BookReview
            {
                UserId = userId,
                BookId = dto.BookId,
                Text = dto.Comment.Trim(),
                CreatedAt = now
            });
        }

        await _db.SaveChangesAsync();
        return await GetById(rating.Id);
    }

    [HttpPatch("{id:int}")]
    public async Task<IActionResult> Patch(int id, [FromBody] UpdateAdminReviewDto dto)
    {
        if (dto.Rating.HasValue && (dto.Rating.Value < 1 || dto.Rating.Value > 5))
            return BadRequest("Rating must be between 1 and 5.");

        var rating = await _db.BookRatings.FirstOrDefaultAsync(x => x.Id == id);
        if (rating == null) return NotFound();

        if (dto.Rating.HasValue)
        {
            rating.Value = dto.Rating.Value;
        }
        rating.UpdatedAt = DateTime.UtcNow;

        var reviews = await _db.BookReviews
            .Where(x => x.UserId == rating.UserId && x.BookId == rating.BookId)
            .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
            .ToListAsync();

        if (dto.Comment is null)
        {
            // no comment field included -> leave existing comment unchanged
        }
        else if (string.IsNullOrWhiteSpace(dto.Comment))
        {
            if (reviews.Count > 0)
            {
                _db.BookReviews.RemoveRange(reviews);
            }
        }
        else
        {
            var text = dto.Comment.Trim();
            if (reviews.Count == 0)
            {
                _db.BookReviews.Add(new BookReview
                {
                    UserId = rating.UserId,
                    BookId = rating.BookId,
                    Text = text,
                    CreatedAt = DateTime.UtcNow
                });
            }
            else
            {
                var keep = reviews[0];
                keep.Text = text;
                keep.UpdatedAt = DateTime.UtcNow;

                if (reviews.Count > 1)
                {
                    _db.BookReviews.RemoveRange(reviews.Skip(1));
                }
            }
        }

        await _db.SaveChangesAsync();
        return await GetById(id);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var rating = await _db.BookRatings.FirstOrDefaultAsync(x => x.Id == id);
        if (rating == null) return NotFound();

        var reviews = await _db.BookReviews
            .Where(x => x.UserId == rating.UserId && x.BookId == rating.BookId)
            .ToListAsync();

        if (reviews.Count > 0)
        {
            _db.BookReviews.RemoveRange(reviews);
        }

        _db.BookRatings.Remove(rating);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private int GetUserId()
    {
        var idStr =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        if (string.IsNullOrWhiteSpace(idStr))
            throw new UnauthorizedAccessException("Missing user id claim.");

        if (!int.TryParse(idStr, out var id))
            throw new UnauthorizedAccessException($"User id claim is not an int: '{idStr}'");

        return id;
    }
}
