using Microsoft.EntityFrameworkCore;
using PersonalLibrary.Api.Data;
using PersonalLibrary.Api.Models;
using PersonalLibrary.Api.Modules.Ratings.Dtos;

namespace PersonalLibrary.Api.Modules.Ratings;

public class RatingsService
{
    private readonly AppDbContext _context;

    public RatingsService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<RatingSummaryDto> GetSummaryAsync(int bookId)
    {
        var query = _context.BookRatings.AsNoTracking().Where(r => r.BookId == bookId);

        var count = await query.CountAsync();
        var average = count == 0 ? 0 : await query.AverageAsync(r => (double)r.Value);

        return new RatingSummaryDto
        {
            Average = Math.Round(average, 1),
            Count = count
        };
    }

    public async Task<MyRatingDto> GetMineAsync(int userId, int bookId)
    {
        var value = await _context.BookRatings.AsNoTracking()
            .Where(r => r.UserId == userId && r.BookId == bookId)
            .Select(r => (int?)r.Value)
            .FirstOrDefaultAsync();

        return new MyRatingDto { Value = value };
    }

    public async Task<MyRatingDto> UpsertAsync(int userId, SetRatingDto dto)
    {
        if (dto.Value < 1 || dto.Value > 5)
            throw new ArgumentException("Rating must be between 1 and 5.");

        var rating = await _context.BookRatings
            .FirstOrDefaultAsync(r => r.UserId == userId && r.BookId == dto.BookId);

        if (rating == null)
        {
            rating = new BookRating
            {
                UserId = userId,
                BookId = dto.BookId,
                Value = dto.Value,
                CreatedAt = DateTime.UtcNow
            };

            _context.BookRatings.Add(rating);
        }
        else
        {
            rating.Value = dto.Value;
            rating.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return new MyRatingDto { Value = rating.Value };
    }
}