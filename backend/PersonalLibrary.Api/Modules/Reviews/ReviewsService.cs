using Microsoft.EntityFrameworkCore;
using PersonalLibrary.Api.Data;
using PersonalLibrary.Api.Models;
using PersonalLibrary.Api.Modules.Reviews.Dtos;

namespace PersonalLibrary.Api.Modules.Reviews;

public class ReviewsService
{
    private readonly AppDbContext _context;

    public ReviewsService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ReviewDto>> GetByBookAsync(int bookId)
    {
        var query =
            from review in _context.BookReviews.AsNoTracking()
            where review.BookId == bookId
            join user in _context.Users.AsNoTracking() on review.UserId equals user.Id
            join rating in _context.BookRatings.AsNoTracking()
                on new { review.BookId, review.UserId }
                equals new { rating.BookId, rating.UserId }
                into ratingGroup
            from rating in ratingGroup.DefaultIfEmpty()
            orderby (review.UpdatedAt ?? review.CreatedAt) descending
            select new ReviewDto(
                review.Id,
                review.UserId,
                review.BookId,
                user.Username,
                review.Text,
                rating != null ? rating.Value : 0,
                review.CreatedAt,
                review.UpdatedAt
            );

        return await query.ToListAsync();
    }

    public async Task<ReviewDto> CreateAsync(int userId, UpsertReviewDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Text))
            throw new ArgumentException("Review text is required.");

        var review = new BookReview
        {
            UserId = userId,
            BookId = dto.BookId,
            Text = dto.Text.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = null
        };

        _context.BookReviews.Add(review);
        await _context.SaveChangesAsync();

        var username = await _context.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => u.Username)
            .FirstAsync();

        var ratingValue = await _context.BookRatings
            .AsNoTracking()
            .Where(r => r.UserId == userId && r.BookId == dto.BookId)
            .Select(r => (int?)r.Value)
            .FirstOrDefaultAsync() ?? 0;

        return new ReviewDto(
            review.Id,
            review.UserId,
            review.BookId,
            username,
            review.Text,
            ratingValue,
            review.CreatedAt,
            review.UpdatedAt
        );
    }

    public async Task<bool> DeleteMineByIdAsync(int userId, int reviewId)
    {
        var review = await _context.BookReviews
            .FirstOrDefaultAsync(r => r.Id == reviewId && r.UserId == userId);

        if (review == null)
            return false;

        _context.BookReviews.Remove(review);
        await _context.SaveChangesAsync();
        return true;
    }
}