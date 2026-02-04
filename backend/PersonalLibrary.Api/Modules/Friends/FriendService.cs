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

    // Pending incoming requests (that others sent to me)
    public async Task<List<FriendRequestDto>> GetIncomingAsync(int userId)
    {
        return await _context.FriendRequests
            .Where(fr => fr.ReceiverId == userId && fr.Status == FriendRequestStatuses.Pending)
            .OrderByDescending(fr => fr.CreatedAt)
            .Select(fr => new FriendRequestDto(
                fr.Id,
                fr.SenderId,
                fr.ReceiverId,
                fr.Status,
                fr.CreatedAt,
                fr.RespondedAt
            ))
            .ToListAsync();
    }

    // Pending outgoing requests (that I sent to others)
    public async Task<List<FriendRequestDto>> GetOutgoingAsync(int userId)
    {
        return await _context.FriendRequests
            .Where(fr => fr.SenderId == userId && fr.Status == FriendRequestStatuses.Pending)
            .OrderByDescending(fr => fr.CreatedAt)
            .Select(fr => new FriendRequestDto(
                fr.Id,
                fr.SenderId,
                fr.ReceiverId,
                fr.Status,
                fr.CreatedAt,
                fr.RespondedAt
            ))
            .ToListAsync();
    }

    // Accepted friends list
    public async Task<List<object>> GetFriendsAsync(int userId)
    {
        var friendIds = await _context.FriendRequests
            .Where(fr => fr.Status == FriendRequestStatuses.Accepted &&
                         (fr.SenderId == userId || fr.ReceiverId == userId))
            .Select(fr => fr.SenderId == userId ? fr.ReceiverId : fr.SenderId)
            .Distinct()
            .ToListAsync();

        var friends = await _context.Users
            .Where(u => friendIds.Contains(u.Id))
            .Select(u => new { u.Id, u.Email })
            .ToListAsync();

        return friends.Cast<object>().ToList();
    }

    // Send a friend request
    public async Task<(bool ok, string error, FriendRequestDto? data)> SendRequestAsync(int senderId, int receiverId)
    {
        // prevent self-request
        if (senderId == receiverId)
            return (false, "You cannot send a friend request to yourself.", null);

        // receiver must exist
        var receiverExists = await _context.Users.AnyAsync(u => u.Id == receiverId);
        if (!receiverExists)
            return (false, "Receiver user not found.", null);

        // prevent duplicates: already friends?
        var alreadyFriends = await _context.FriendRequests.AnyAsync(fr =>
            fr.Status == FriendRequestStatuses.Accepted &&
            ((fr.SenderId == senderId && fr.ReceiverId == receiverId) ||
             (fr.SenderId == receiverId && fr.ReceiverId == senderId)));

        if (alreadyFriends)
            return (false, "You are already friends.", null);

        // prevent duplicates: pending exists in either direction
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

        // ✅ Notification to receiver: friend request received
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

    // Accept (only receiver can accept)
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

        // ✅ Notification to sender: request accepted
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

    // Reject (only receiver can reject)
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

    // Cancel (only sender can cancel; deletes pending request)
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

    // Remove friend (deletes accepted relationship)
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
