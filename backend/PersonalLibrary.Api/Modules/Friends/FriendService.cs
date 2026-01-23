using Microsoft.EntityFrameworkCore;
using PersonalLibrary.Api.Data;
using PersonalLibrary.Api.Models;
using PersonalLibrary.Api.Modules.Friends.Dtos;

namespace PersonalLibrary.Api.Modules.Friends;

public class FriendService
{
    private readonly AppDbContext _context;

    public FriendService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<FriendRequestDto>> GetIncomingAsync(int userId)
    {
        return await _context.FriendRequests
            .Where(fr => fr.ReceiverId == userId)
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

    public async Task<List<FriendRequestDto>> GetOutgoingAsync(int userId)
    {
        return await _context.FriendRequests
            .Where(fr => fr.SenderId == userId)
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

    public async Task<List<object>> GetFriendsAsync(int userId)
    {
        var friendIds = await _context.FriendRequests
            .Where(fr => fr.Status == "Accepted" && (fr.SenderId == userId || fr.ReceiverId == userId))
            .Select(fr => fr.SenderId == userId ? fr.ReceiverId : fr.SenderId)
            .Distinct()
            .ToListAsync();

        var friends = await _context.Users
            .Where(u => friendIds.Contains(u.Id))
            .Select(u => new { u.Id, u.Email })
            .ToListAsync();

        return friends.Cast<object>().ToList();
    }

    public async Task<(bool ok, string error, FriendRequestDto? data)> SendRequestAsync(int senderId, int receiverId)
    {
        if (senderId == receiverId)
            return (false, "You cannot send a friend request to yourself.", null);

        var receiverExists = await _context.Users.AnyAsync(u => u.Id == receiverId);
        if (!receiverExists)
            return (false, "Receiver user not found.", null);

        var alreadyFriends = await _context.FriendRequests.AnyAsync(fr =>
            fr.Status == "Accepted" &&
            ((fr.SenderId == senderId && fr.ReceiverId == receiverId) ||
             (fr.SenderId == receiverId && fr.ReceiverId == senderId)));

        if (alreadyFriends)
            return (false, "You are already friends.", null);

        var pendingExists = await _context.FriendRequests.AnyAsync(fr =>
            fr.Status == "Pending" &&
            ((fr.SenderId == senderId && fr.ReceiverId == receiverId) ||
             (fr.SenderId == receiverId && fr.ReceiverId == senderId)));

        if (pendingExists)
            return (false, "A pending friend request already exists between these users.", null);

        var request = new FriendRequest
        {
            SenderId = senderId,
            ReceiverId = receiverId,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.FriendRequests.Add(request);
        await _context.SaveChangesAsync();

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

    public async Task<(bool ok, string error)> AcceptAsync(int userId, int requestId)
    {
        var req = await _context.FriendRequests.FirstOrDefaultAsync(fr => fr.Id == requestId);
        if (req == null) return (false, "Friend request not found.");

        if (req.ReceiverId != userId)
            return (false, "You are not allowed to accept this request.");

        if (req.Status != "Pending")
            return (false, "Only pending requests can be accepted.");

        req.Status = "Accepted";
        req.RespondedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return (true, "");
    }

    public async Task<(bool ok, string error)> RejectAsync(int userId, int requestId)
    {
        var req = await _context.FriendRequests.FirstOrDefaultAsync(fr => fr.Id == requestId);
        if (req == null) return (false, "Friend request not found.");

        if (req.ReceiverId != userId)
            return (false, "You are not allowed to reject this request.");

        if (req.Status != "Pending")
            return (false, "Only pending requests can be rejected.");

        req.Status = "Rejected";
        req.RespondedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return (true, "");
    }

    public async Task<(bool ok, string error)> CancelAsync(int userId, int requestId)
    {
        var req = await _context.FriendRequests.FirstOrDefaultAsync(fr => fr.Id == requestId);
        if (req == null) return (false, "Friend request not found.");

        if (req.SenderId != userId)
            return (false, "You are not allowed to cancel this request.");

        if (req.Status != "Pending")
            return (false, "Only pending requests can be cancelled.");

        _context.FriendRequests.Remove(req);
        await _context.SaveChangesAsync();

        return (true, "");
    }

    public async Task<(bool ok, string error)> RemoveFriendAsync(int userId, int friendId)
    {
        var accepted = await _context.FriendRequests.FirstOrDefaultAsync(fr =>
            fr.Status == "Accepted" &&
            ((fr.SenderId == userId && fr.ReceiverId == friendId) ||
             (fr.SenderId == friendId && fr.ReceiverId == userId)));

        if (accepted == null)
            return (false, "Friendship not found.");

        _context.FriendRequests.Remove(accepted);
        await _context.SaveChangesAsync();

        return (true, "");
    }
}