using Microsoft.EntityFrameworkCore;
using PersonalLibrary.Api.Data;
using PersonalLibrary.Api.Models;
using PersonalLibrary.Api.Modules.Notifications.Dtos;

namespace PersonalLibrary.Api.Modules.Notifications;

public class NotificationService
{
    private readonly AppDbContext _context;
    public NotificationService(AppDbContext context) => _context = context;

    public async Task CreateAsync(Notification n)
    {
        _context.Notifications.Add(n);
        await _context.SaveChangesAsync();
    }

    public async Task<List<NotificationDto>> GetMyAsync(int userId, bool unreadOnly = false)
    {
        var q = _context.Notifications.Where(n => n.UserId == userId);

        if (unreadOnly)
            q = q.Where(n => !n.IsRead);

        return await q.OrderByDescending(n => n.CreatedAt)
            .Select(n => new NotificationDto(
                n.Id,
                n.Type,
                n.Title,
                n.Message,
                n.IsRead,
                n.CreatedAt,
                n.FriendRequestId,
                n.RecommendationId,
                n.FromUserId,
                n.BookId
            ))
            .ToListAsync();
    }

    public async Task<int> GetUnreadCountAsync(int userId)
        => await _context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);

    public async Task<(bool ok, string error)> MarkReadAsync(int userId, int notificationId)
    {
        var n = await _context.Notifications.FirstOrDefaultAsync(x => x.Id == notificationId && x.UserId == userId);
        if (n == null) return (false, "Notification not found.");

        if (!n.IsRead)
        {
            n.IsRead = true;
            n.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return (true, "");
    }

    public async Task<int> MarkAllReadAsync(int userId)
    {
        var list = await _context.Notifications.Where(n => n.UserId == userId && !n.IsRead).ToListAsync();
        foreach (var n in list)
        {
            n.IsRead = true;
            n.ReadAt = DateTime.UtcNow;
        }
        await _context.SaveChangesAsync();
        return list.Count;
    }
}
