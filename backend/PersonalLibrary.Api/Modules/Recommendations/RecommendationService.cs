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

    public async Task<(bool ok, string error, RecommendationDto? data)> SendAsync(
        int fromUserId,
        SendRecommendationDto dto
    )
    {
        // 1) Validate receiver username
        var toUsername = (dto.ToUsername ?? "").Trim();
        if (string.IsNullOrWhiteSpace(toUsername))
            return (false, "Receiver username is required.", null);

        // 2) Resolve receiver by username (case-insensitive)
        // NOTE: ToUpper() is usually well-translated by EF for SQL Server
        var toUser = await _context.Users.FirstOrDefaultAsync(u =>
            u.Username != null && u.Username.ToUpper() == toUsername.ToUpper());

        if (toUser == null)
            return (false, "Receiver user not found.", null);

        if (fromUserId == toUser.Id)
            return (false, "You cannot send a gift to yourself.", null);

        // 3) Book exists
        var bookExists = await _context.Books.AnyAsync(b => b.Id == dto.BookId);
        if (!bookExists)
            return (false, "Book not found.", null);

        // 4) Friends-only rule
        var friends = await AreFriendsAsync(fromUserId, toUser.Id);
        if (!friends)
            return (false, "You are not friends.", null);

        // 5) Receiver already has the book in library -> block
        var receiverHasBook = await _context.UserBooks.AnyAsync(ub =>
            ub.UserId == toUser.Id && ub.BookId == dto.BookId);

        if (receiverHasBook)
            return (false, "This friend already has this book in their library.", null);

        // 6) Prevent duplicate gift (same sender -> same receiver -> same book)
        var alreadyGifted = await _context.BookRecommendations.AnyAsync(r =>
            r.FromUserId == fromUserId &&
            r.ToUserId == toUser.Id &&
            r.BookId == dto.BookId);

        if (alreadyGifted)
            return (false, "You already gifted this book to this friend.", null);

        // 7) Create recommendation
        var rec = new BookRecommendation
        {
            FromUserId = fromUserId,
            ToUserId = toUser.Id,
            BookId = dto.BookId,
            Message = string.IsNullOrWhiteSpace(dto.Message) ? null : dto.Message.Trim(),
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
            .AsNoTracking()
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
            .AsNoTracking()
            .Where(r => r.FromUserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new RecommendationDto(
                r.Id, r.FromUserId, r.ToUserId, r.BookId, r.Message, r.CreatedAt
            ))
            .ToListAsync();
    }

    // ✅ Accept = add to receiver library + delete recommendation
    public async Task<(bool ok, string error)> AcceptAsync(int userId, int recommendationId)
    {
        var rec = await _context.BookRecommendations
            .FirstOrDefaultAsync(r => r.Id == recommendationId);

        if (rec == null)
            return (false, "Gift not found.");

        if (rec.ToUserId != userId)
            return (false, "You can only accept gifts sent to you.");

        var existsInLibrary = await _context.UserBooks
            .AnyAsync(ub => ub.UserId == userId && ub.BookId == rec.BookId);

        if (!existsInLibrary)
        {
            var userBook = new UserBook
            {
                UserId = userId,
                BookId = rec.BookId,
                Status = "to-read"
            };

            _context.UserBooks.Add(userBook);
        }

        _context.BookRecommendations.Remove(rec);
        await _context.SaveChangesAsync();

        return (true, "");
    }

    // ✅ Delete in Inbox (receiver) or Cancel in Sent (sender)
    public async Task<(bool ok, string error)> DeleteAsync(int userId, int recommendationId)
    {
        var rec = await _context.BookRecommendations
            .FirstOrDefaultAsync(r => r.Id == recommendationId);

        if (rec == null)
            return (false, "Gift not found.");

        if (rec.FromUserId != userId && rec.ToUserId != userId)
            return (false, "Not allowed.");

        _context.BookRecommendations.Remove(rec);
        await _context.SaveChangesAsync();

        return (true, "");
    }
}
