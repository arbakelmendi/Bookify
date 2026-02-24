using Microsoft.EntityFrameworkCore;
using PersonalLibrary.Api.Data;
using PersonalLibrary.Api.Models;
using PersonalLibrary.Api.Modules.Friends.Dtos;
using PersonalLibrary.Api.Modules.Notifications;

namespace PersonalLibrary.Api.Modules.Friends;

public static class FriendRequestStatuses
{
    public const string Pending = "Pending";
    public const string Accepted = "Accepted";
    public const string Rejected = "Rejected";
}

public class FriendService
{
    private readonly AppDbContext _context;
    private readonly NotificationService _notifications;

    public FriendService(AppDbContext context, NotificationService notifications)
    {
        _context = context;
        _notifications = notifications;
    }

    public Task<int> GetIncomingPendingCountAsync(int userId)
    {
        return _context.FriendRequests
            .AsNoTracking()
            .CountAsync(fr => fr.ReceiverId == userId && fr.Status == FriendRequestStatuses.Pending);
    }

    // ✅ Pending incoming requests (that others sent to me)
    public async Task<List<FriendRequestViewDto>> GetIncomingAsync(int userId)
    {
        var query =
            from fr in _context.FriendRequests.AsNoTracking()
            join sender in _context.Users.AsNoTracking() on fr.SenderId equals sender.Id
            join receiver in _context.Users.AsNoTracking() on fr.ReceiverId equals receiver.Id
            where fr.ReceiverId == userId && fr.Status == FriendRequestStatuses.Pending
            orderby fr.CreatedAt descending
            select new FriendRequestViewDto(
                fr.Id,
                fr.SenderId,
                sender.Email,
                sender.Username,
                fr.ReceiverId,
                receiver.Email,
                receiver.Username,
                fr.Status,
                fr.CreatedAt,
                fr.RespondedAt
            );

        return await query.ToListAsync();
    }

    // ✅ Pending outgoing requests (that I sent)
    public async Task<List<FriendRequestViewDto>> GetOutgoingAsync(int userId)
    {
        var query =
            from fr in _context.FriendRequests.AsNoTracking()
            join sender in _context.Users.AsNoTracking() on fr.SenderId equals sender.Id
            join receiver in _context.Users.AsNoTracking() on fr.ReceiverId equals receiver.Id
            where fr.SenderId == userId && fr.Status == FriendRequestStatuses.Pending
            orderby fr.CreatedAt descending
            select new FriendRequestViewDto(
                fr.Id,
                fr.SenderId,
                sender.Email,
                sender.Username,
                fr.ReceiverId,
                receiver.Email,
                receiver.Username,
                fr.Status,
                fr.CreatedAt,
                fr.RespondedAt
            );

        return await query.ToListAsync();
    }

    // ✅ Accepted friends list
    public async Task<List<object>> GetFriendsAsync(int userId)
    {
        var friendIds = await _context.FriendRequests
            .AsNoTracking()
            .Where(fr => fr.Status == FriendRequestStatuses.Accepted &&
                         (fr.SenderId == userId || fr.ReceiverId == userId))
            .Select(fr => fr.SenderId == userId ? fr.ReceiverId : fr.SenderId)
            .Distinct()
            .ToListAsync();

        var friends = await _context.Users
            .AsNoTracking()
            .Where(u => friendIds.Contains(u.Id))
            .Select(u => new { u.Id, u.Email, u.Username })
            .ToListAsync();

        return friends.Cast<object>().ToList();
    }

    public async Task<List<FriendCardDto>> GetFriendsCardsAsync(int userId)
    {
        var friendIds = await _context.FriendRequests
            .AsNoTracking()
            .Where(fr => fr.Status == FriendRequestStatuses.Accepted &&
                         (fr.SenderId == userId || fr.ReceiverId == userId))
            .Select(fr => fr.SenderId == userId ? fr.ReceiverId : fr.SenderId)
            .Distinct()
            .ToListAsync();

        if (friendIds.Count == 0)
            return new List<FriendCardDto>();

        var friends = await _context.Users
            .AsNoTracking()
            .Where(u => friendIds.Contains(u.Id))
            .Select(u => new { u.Id, u.Email, u.Username })
            .ToListAsync();

        var friendBooks = await _context.UserBooks
            .AsNoTracking()
            .Where(ub => friendIds.Contains(ub.UserId))
            .Select(ub => new FriendBookProjection(
                ub.UserId,
                ub.BookId,
                ub.LastUpdated,
                ub.Book != null ? ub.Book.CoverImageUrl : string.Empty
            ))
            .ToListAsync();

        var booksByFriend = friendBooks
            .GroupBy(b => b.UserId)
            .ToDictionary(g => g.Key, g => g.ToList());

        return friends
            .OrderBy(f => f.Username ?? f.Email)
            .Select(f =>
            {
                booksByFriend.TryGetValue(f.Id, out var booksForFriend);
                var books = booksForFriend ?? new List<FriendBookProjection>();

                var recentBooks = books
                    .OrderByDescending(b => b.LastUpdated)
                    .Take(3)
                    .Select(b => new FriendRecentBookDto(
                        b.BookId,
                        b.CoverImageUrl ?? string.Empty
                    ))
                    .ToList();

                return new FriendCardDto(
                    f.Id,
                    f.Email,
                    f.Username,
                    books.Count,
                    recentBooks
                );
            })
            .ToList();
    }

    private sealed record FriendBookProjection(
        int UserId,
        int BookId,
        DateTime LastUpdated,
        string CoverImageUrl
    );

    // ✅ Send a friend request
    public async Task<(bool ok, string error, FriendRequestDto? data)> SendRequestAsync(int senderId, int receiverId)
    {
        if (senderId == receiverId)
            return (false, "You cannot send a friend request to yourself.", null);

        var receiverExists = await _context.Users.AnyAsync(u => u.Id == receiverId);
        if (!receiverExists)
            return (false, "Receiver user not found.", null);

        var alreadyFriends = await _context.FriendRequests.AnyAsync(fr =>
            fr.Status == FriendRequestStatuses.Accepted &&
            ((fr.SenderId == senderId && fr.ReceiverId == receiverId) ||
             (fr.SenderId == receiverId && fr.ReceiverId == senderId)));

        if (alreadyFriends)
            return (false, "You are already friends.", null);

        var pendingExists = await _context.FriendRequests.AnyAsync(fr =>
            fr.Status == FriendRequestStatuses.Pending &&
            ((fr.SenderId == senderId && fr.ReceiverId == receiverId) ||
             (fr.SenderId == receiverId && fr.ReceiverId == senderId)));

        if (pendingExists)
            return (false, "A pending friend request already exists between these users.", null);

        var request = new FriendRequest
        {
            SenderId = senderId,
            ReceiverId = receiverId,
            Status = FriendRequestStatuses.Pending,
            CreatedAt = DateTime.UtcNow,
            RespondedAt = null
        };

        _context.FriendRequests.Add(request);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return (false, "A pending friend request already exists between these users.", null);
        }

        await _notifications.CreateAsync(new Notification
        {
            UserId = receiverId,
            Type = "FRIEND_REQUEST_RECEIVED",
            Title = "Friend request",
            Message = "You received a new friend request.",
            FriendRequestId = request.Id,
            FromUserId = senderId
        });

        var dto = new FriendRequestDto(
            request.Id,
            request.SenderId,
            request.ReceiverId,
            request.Status,
            request.CreatedAt,
            request.RespondedAt
        );

        return (true, "", dto);
    }

    // ✅ Accept (only receiver can accept)
    public async Task<(bool ok, string error)> AcceptAsync(int userId, int requestId)
    {
        var req = await _context.FriendRequests.FirstOrDefaultAsync(fr => fr.Id == requestId);
        if (req == null) return (false, "Friend request not found.");

        if (req.ReceiverId != userId)
            return (false, "You are not allowed to accept this request.");

        if (req.Status != FriendRequestStatuses.Pending)
            return (false, "Only pending requests can be accepted.");

        req.Status = FriendRequestStatuses.Accepted;
        req.RespondedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _notifications.CreateAsync(new Notification
        {
            UserId = req.SenderId,
            Type = "FRIEND_REQUEST_ACCEPTED",
            Title = "Friend request accepted",
            Message = "Your friend request was accepted.",
            FriendRequestId = req.Id,
            FromUserId = req.ReceiverId
        });

        return (true, "");
    }

    // ✅ Reject (only receiver can reject)
    public async Task<(bool ok, string error)> RejectAsync(int userId, int requestId)
    {
        var req = await _context.FriendRequests.FirstOrDefaultAsync(fr => fr.Id == requestId);
        if (req == null) return (false, "Friend request not found.");

        if (req.ReceiverId != userId)
            return (false, "You are not allowed to reject this request.");

        if (req.Status != FriendRequestStatuses.Pending)
            return (false, "Only pending requests can be rejected.");

        req.Status = FriendRequestStatuses.Rejected;
        req.RespondedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return (true, "");
    }

    // ✅ Cancel (only sender can cancel; deletes pending request)
    public async Task<(bool ok, string error)> CancelAsync(int userId, int requestId)
    {
        var req = await _context.FriendRequests.FirstOrDefaultAsync(fr => fr.Id == requestId);
        if (req == null) return (false, "Friend request not found.");

        if (req.SenderId != userId)
            return (false, "You are not allowed to cancel this request.");

        if (req.Status != FriendRequestStatuses.Pending)
            return (false, "Only pending requests can be cancelled.");

        _context.FriendRequests.Remove(req);
        await _context.SaveChangesAsync();

        return (true, "");
    }

    // ✅ Get a friend's library (books only, no progress details)
    public async Task<(bool ok, string error, List<FriendLibraryBookDto>? books)> GetFriendLibraryAsync(int userId, int friendId)
    {
        var canAccess = await CanAccessFriendDataAsync(userId, friendId);
        if (!canAccess)
            return (false, "You are not friends with this user.", null);

        var books = await _context.UserBooks
            .AsNoTracking()
            .Where(ub => ub.UserId == friendId)
            .Select(ub => new FriendLibraryBookDto(
                ub.BookId,
                ub.Book!.Title,
                ub.Book!.Author,
                ub.Book!.CoverImageUrl,
                ub.Status,
                ub.PagesRead,
                ub.TotalPages,
                ub.Percent
            ))
            .ToListAsync();

        return (true, "", books);
    }

    public async Task<(bool ok, string error, FriendStatsDto? data)> GetFriendStatsAsync(int userId, int friendId)
    {
        var canAccess = await CanAccessFriendDataAsync(userId, friendId);
        if (!canAccess)
            return (false, "You are not friends with this user.", null);

        var friendConnections = await _context.FriendRequests
            .AsNoTracking()
            .Where(fr =>
                fr.Status == FriendRequestStatuses.Accepted &&
                (fr.SenderId == friendId || fr.ReceiverId == friendId))
            .Select(fr => fr.SenderId == friendId ? fr.ReceiverId : fr.SenderId)
            .Distinct()
            .CountAsync();

        var reviewsCount = await _context.BookReviews
            .AsNoTracking()
            .CountAsync(r => r.UserId == friendId);

        var dto = new FriendStatsDto
        {
            Friends = friendConnections,
            Reviews = reviewsCount
        };

        return (true, "", dto);
    }

    public async Task<(bool ok, string error, List<FriendMiniDto>? data)> GetFriendFriendsAsync(int userId, int friendId)
    {
        var canAccess = await CanAccessFriendDataAsync(userId, friendId);
        if (!canAccess)
            return (false, "You are not friends with this user.", null);

        var friendIds = await _context.FriendRequests
            .AsNoTracking()
            .Where(fr => fr.Status == FriendRequestStatuses.Accepted &&
                         (fr.SenderId == friendId || fr.ReceiverId == friendId))
            .Select(fr => fr.SenderId == friendId ? fr.ReceiverId : fr.SenderId)
            .Distinct()
            .ToListAsync();

        if (friendIds.Count == 0)
            return (true, "", new List<FriendMiniDto>());

        var friends = await _context.Users
            .AsNoTracking()
            .Where(u => friendIds.Contains(u.Id))
            .OrderBy(u => u.Username)
            .ThenBy(u => u.Email)
            .Select(u => new FriendMiniDto(u.Id, u.Email, u.Username))
            .ToListAsync();

        return (true, "", friends);
    }

    public async Task<(bool ok, string error, List<FriendReviewDto>? data)> GetFriendReviewsAsync(int userId, int friendId)
    {
        var canAccess = await CanAccessFriendDataAsync(userId, friendId);
        if (!canAccess)
            return (false, "You are not friends with this user.", null);

        var ratingsForFriend = _context.BookRatings
            .AsNoTracking()
            .Where(br => br.UserId == friendId);

        var reviews = await (
            from r in _context.BookReviews.AsNoTracking()
            join b in _context.Books.AsNoTracking() on r.BookId equals b.Id
            join br in ratingsForFriend on r.BookId equals br.BookId into ratingsJoin
            from rating in ratingsJoin.DefaultIfEmpty()
            where r.UserId == friendId
            orderby (r.UpdatedAt ?? r.CreatedAt) descending
            select new FriendReviewDto(
                r.Id,
                r.BookId,
                b.Title,
                b.CoverImageUrl,
                r.Text,
                rating != null ? rating.Value : 0,
                r.CreatedAt,
                r.UpdatedAt
            )
        ).ToListAsync();

        return (true, "", reviews);
    }

    private async Task<bool> CanAccessFriendDataAsync(int userId, int friendId)
    {
        if (userId == friendId)
            return true;

        return await _context.FriendRequests
            .AsNoTracking()
            .AnyAsync(fr =>
                fr.Status == FriendRequestStatuses.Accepted &&
                ((fr.SenderId == userId && fr.ReceiverId == friendId) ||
                 (fr.SenderId == friendId && fr.ReceiverId == userId)));
    }

    // ✅ Remove friend (deletes accepted relationship)
    public async Task<(bool ok, string error)> RemoveFriendAsync(int userId, int friendId)
    {
        var accepted = await _context.FriendRequests.FirstOrDefaultAsync(fr =>
            fr.Status == FriendRequestStatuses.Accepted &&
            ((fr.SenderId == userId && fr.ReceiverId == friendId) ||
             (fr.SenderId == friendId && fr.ReceiverId == userId)));

        if (accepted == null)
            return (false, "Friendship not found.");

        _context.FriendRequests.Remove(accepted);
        await _context.SaveChangesAsync();

        return (true, "");
    }
}
