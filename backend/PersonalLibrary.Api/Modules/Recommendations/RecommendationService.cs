using Microsoft.EntityFrameworkCore;
using PersonalLibrary.Api.Data;
using PersonalLibrary.Api.Models;
using PersonalLibrary.Api.Modules.Friends;
using PersonalLibrary.Api.Modules.Recommendations.Dtos;

namespace PersonalLibrary.Api.Modules.Recommendations;

public class RecommendationService
{
    private readonly AppDbContext _context;

    public RecommendationService(AppDbContext context)
    {
        _context = context;
    }

    private Task<bool> AreFriendsAsync(int userAId, int userBId)
    {
        return _context.FriendRequests.AnyAsync(fr =>
            fr.Status == FriendRequestStatuses.Accepted &&
            ((fr.SenderId == userAId && fr.ReceiverId == userBId) ||
             (fr.SenderId == userBId && fr.ReceiverId == userAId)));
    }

    public async Task<(bool ok, string error, RecommendationDto? data)> SendAsync(int fromUserId, SendRecommendationDto dto)
    {
        if (fromUserId == dto.ToUserId)
            return (false, "You cannot send a recommendation to yourself.", null);

        var toUserExists = await _context.Users.AnyAsync(u => u.Id == dto.ToUserId);
        if (!toUserExists)
            return (false, "Receiver user not found.", null);

        var bookExists = await _context.Books.AnyAsync(b => b.Id == dto.BookId);
        if (!bookExists)
            return (false, "Book not found.", null);

        var friends = await AreFriendsAsync(fromUserId, dto.ToUserId);
        if (!friends)
            return (false, "Only friends can send recommendations.", null);

        var rec = new BookRecommendation
        {
            FromUserId = fromUserId,
            ToUserId = dto.ToUserId,
            BookId = dto.BookId,
            Message = dto.Message,
            CreatedAt = DateTime.UtcNow
        };

        _context.BookRecommendations.Add(rec);
        await _context.SaveChangesAsync();

        var outDto = new RecommendationDto(
            rec.Id,
            rec.FromUserId,
            rec.ToUserId,
            rec.BookId,
            rec.Message,
            rec.CreatedAt
        );

        return (true, "", outDto);
    }

    public async Task<List<RecommendationDto>> InboxAsync(int userId)
    {
        return await _context.BookRecommendations
            .Where(r => r.ToUserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new RecommendationDto(
                r.Id, r.FromUserId, r.ToUserId, r.BookId, r.Message, r.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task<List<RecommendationDto>> SentAsync(int userId)
    {
        return await _context.BookRecommendations
            .Where(r => r.FromUserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new RecommendationDto(
                r.Id, r.FromUserId, r.ToUserId, r.BookId, r.Message, r.CreatedAt
            ))
            .ToListAsync();
    }
}
