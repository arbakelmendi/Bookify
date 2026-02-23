using Microsoft.EntityFrameworkCore;
using PersonalLibrary.Api.Data;
using PersonalLibrary.Api.Models;
using PersonalLibrary.Api.Modules.Friends;
using PersonalLibrary.Api.Modules.Messages.Dtos;

namespace PersonalLibrary.Api.Modules.Messages;

public class MessageService
{
    private readonly AppDbContext _context;

    public MessageService(AppDbContext context)
    {
        _context = context;
    }

    private Task<bool> AreFriendsAsync(int userA, int userB) =>
        _context.FriendRequests.AsNoTracking().AnyAsync(fr =>
            fr.Status == FriendRequestStatuses.Accepted &&
            ((fr.SenderId == userA && fr.ReceiverId == userB) ||
             (fr.SenderId == userB && fr.ReceiverId == userA)));

    public async Task<List<ConversationSummaryDto>> GetConversationsAsync(int userId)
    {
        // Get all friend IDs
        var friendIds = await _context.FriendRequests
            .AsNoTracking()
            .Where(fr => fr.Status == FriendRequestStatuses.Accepted &&
                         (fr.SenderId == userId || fr.ReceiverId == userId))
            .Select(fr => fr.SenderId == userId ? fr.ReceiverId : fr.SenderId)
            .Distinct()
            .ToListAsync();

        if (friendIds.Count == 0) return [];

        // For each friend, get the last message and unread count
        var result = new List<ConversationSummaryDto>();

        var friendUsernames = await _context.Users
            .AsNoTracking()
            .Where(u => friendIds.Contains(u.Id))
            .Select(u => new { u.Id, u.Username })
            .ToDictionaryAsync(u => u.Id, u => u.Username);

        foreach (var friendId in friendIds)
        {
            var lastMsg = await _context.Messages
                .AsNoTracking()
                .Where(m => (m.SenderId == userId && m.ReceiverId == friendId) ||
                            (m.SenderId == friendId && m.ReceiverId == userId))
                .OrderByDescending(m => m.SentAt)
                .Select(m => new { m.Content, m.SentAt })
                .FirstOrDefaultAsync();

            var unread = await _context.Messages
                .AsNoTracking()
                .CountAsync(m => m.SenderId == friendId && m.ReceiverId == userId && !m.IsRead);

            result.Add(new ConversationSummaryDto(
                friendId,
                friendUsernames.GetValueOrDefault(friendId) ?? $"User #{friendId}",
                lastMsg?.Content,
                lastMsg?.SentAt,
                unread
            ));
        }

        return result.OrderByDescending(c => c.LastMessageAt).ToList();
    }

    public async Task<(bool ok, string error, List<MessageDto>? messages)> GetMessagesAsync(
        int userId, int friendId, int page, int pageSize = 50)
    {
        if (!await AreFriendsAsync(userId, friendId))
            return (false, "You are not friends with this user.", null);

        var messages = await _context.Messages
            .AsNoTracking()
            .Where(m => (m.SenderId == userId && m.ReceiverId == friendId) ||
                        (m.SenderId == friendId && m.ReceiverId == userId))
            .OrderBy(m => m.SentAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new MessageDto(m.Id, m.SenderId, m.ReceiverId, m.Content, m.SentAt, m.IsRead))
            .ToListAsync();

        return (true, "", messages);
    }

    public async Task<(bool ok, string error, MessageDto? message)> SendMessageAsync(
        int senderId, int receiverId, string content)
    {
        if (!await AreFriendsAsync(senderId, receiverId))
            return (false, "You are not friends with this user.", null);

        var msg = new Message
        {
            SenderId = senderId,
            ReceiverId = receiverId,
            Content = content.Trim(),
            SentAt = DateTime.UtcNow,
            IsRead = false
        };

        _context.Messages.Add(msg);
        await _context.SaveChangesAsync();

        return (true, "", new MessageDto(msg.Id, msg.SenderId, msg.ReceiverId, msg.Content, msg.SentAt, msg.IsRead));
    }

    public async Task MarkReadAsync(int userId, int friendId)
    {
        var unread = await _context.Messages
            .Where(m => m.SenderId == friendId && m.ReceiverId == userId && !m.IsRead)
            .ToListAsync();

        if (unread.Count == 0) return;

        foreach (var m in unread) m.IsRead = true;
        await _context.SaveChangesAsync();
    }
}
