using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PersonalLibrary.Api.Modules.Notifications;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly NotificationService _service;
    public NotificationsController(NotificationService service) => _service = service;

    // GET /api/Notifications?unreadOnly=true
    [HttpGet]
    public async Task<IActionResult> My([FromQuery] bool unreadOnly = false)
    {
        var userId = GetUserId();
        var data = await _service.GetMyAsync(userId, unreadOnly);
        return Ok(data);
    }

    // GET /api/Notifications/unread-count
    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount()
    {
        var userId = GetUserId();
        var count = await _service.GetUnreadCountAsync(userId);
        return Ok(new { count });
    }

    // POST /api/Notifications/{id}/read
    [HttpPost("{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var userId = GetUserId();
        var (ok, error) = await _service.MarkReadAsync(userId, id);
        if (!ok) return NotFound(new { message = error });
        return NoContent();
    }

    // POST /api/Notifications/read-all
    [HttpPost("read-all")]
    public async Task<IActionResult> ReadAll()
    {
        var userId = GetUserId();
        var changed = await _service.MarkAllReadAsync(userId);
        return Ok(new { marked = changed });
    }

    private int GetUserId()
    {
        var idStr =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        if (!int.TryParse(idStr, out var userId))
            throw new UnauthorizedAccessException("Invalid user id claim.");

        return userId;
    }
}
