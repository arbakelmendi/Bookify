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

    // Add or update rating
    public async Task<RatingDto> RateAsync(int userId, CreateRatingDto dto)
    {
        if (dto.Rating < 1 || dto.Rating > 5)
            throw new ArgumentException("Rating must be between 1 and 5.");

        var rating = await _context.BookRatings
            .FirstOrDefaultAsync(r => r.UserId == userId && r.BookId == dto.BookId);

        if (rating == null)
        {
            rating = new BookRating
            {
                UserId = userId,
                BookId = dto.BookId,
                Rating = dto.Rating
            };
            _context.BookRatings.Add(rating);
        }
        else
        {
            rating.Rating = dto.Rating;
        }

        await _context.SaveChangesAsync();

        return new RatingDto(
            rating.Id,
            rating.UserId,
            rating.BookId,
            rating.Rating
        );
    }

    public async Task<List<RatingDto>> GetByBookAsync(int bookId)
    {
        return await _context.BookRatings
            .Where(r => r.BookId == bookId)
            .Select(r => new RatingDto(
                r.Id,
                r.UserId,
                r.BookId,
                r.Rating
            ))
            .ToListAsync();
    }

    public async Task<double> GetAverageAsync(int bookId)
    {
        var ratings = await _context.BookRatings
            .Where(r => r.BookId == bookId)
            .Select(r => r.Rating)
            .ToListAsync();

        if (!ratings.Any()) return 0;

        return Math.Round(ratings.Average(), 2);
    }
}
