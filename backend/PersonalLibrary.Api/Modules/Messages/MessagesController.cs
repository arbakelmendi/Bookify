using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using PersonalLibrary.Api.Modules.Messages.Dtos;

namespace PersonalLibrary.Api.Modules.Messages;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MessagesController : ControllerBase
{
    private readonly MessageService _service;
    private readonly IHubContext<ChatHub> _hub;

    public MessagesController(MessageService service, IHubContext<ChatHub> hub)
    {
        _service = service;
        _hub = hub;
    }

    // GET /api/Messages/conversations
    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations()
    {
        var userId = GetUserId();
        var conversations = await _service.GetConversationsAsync(userId);
        return Ok(conversations);
    }

    // POST /api/Messages/with/{friendId}
    [HttpPost("with/{friendId:int}")]
    public async Task<IActionResult> EnsureConversation(int friendId)
    {
        var userId = GetUserId();
        var (ok, error, conversation) = await _service.EnsureConversationAsync(userId, friendId);

        if (!ok)
        {
            if (error.Contains("not friends", StringComparison.OrdinalIgnoreCase))
                return Forbid();
            if (error.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new { message = error });
            return BadRequest(new { message = error });
        }

        return Ok(conversation);
    }

    // GET /api/Messages/{friendId}?page=1
    [HttpGet("{friendId:int}")]
    public async Task<IActionResult> GetMessages(int friendId, [FromQuery] int page = 1)
    {
        var userId = GetUserId();
        var (ok, error, messages) = await _service.GetMessagesAsync(userId, friendId, page);

        if (!ok)
        {
            if (error.Contains("not friends", StringComparison.OrdinalIgnoreCase))
                return Forbid();
            return BadRequest(new { message = error });
        }

        return Ok(messages);
    }

    // POST /api/Messages/{friendId}
    [HttpPost("{friendId:int}")]
    public async Task<IActionResult> Send(int friendId, [FromBody] SendMessageDto dto)
    {
        var userId = GetUserId();
        var (ok, error, msg) = await _service.SendMessageAsync(userId, friendId, dto.Content);

        if (!ok)
        {
            if (error.Contains("not friends", StringComparison.OrdinalIgnoreCase))
                return Forbid();
            return BadRequest(new { message = error });
        }

        // Push real-time notification to receiver if they are online
        await _hub.Clients.Group($"user-{friendId}").SendAsync("ReceiveMessage", msg);

        return Ok(msg);
    }

    // PUT /api/Messages/{friendId}/read
    [HttpPut("{friendId:int}/read")]
    public async Task<IActionResult> MarkRead(int friendId)
    {
        var userId = GetUserId();
        await _service.MarkReadAsync(userId, friendId);
        return NoContent();
    }

    // PUT /api/Messages/{messageId}
    [HttpPut("{messageId:int}")]
    public async Task<IActionResult> UpdateMessage(int messageId, [FromBody] UpdateMessageDto dto)
    {
        var userId = GetUserId();
        var (ok, error, message) = await _service.UpdateMessageAsync(userId, messageId, dto.Content);

        if (!ok)
        {
            if (error.Contains("own messages", StringComparison.OrdinalIgnoreCase))
                return Forbid();
            if (error.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new { message = error });
            return BadRequest(new { message = error });
        }

        return Ok(message);
    }

    // DELETE /api/Messages/{messageId}
    [HttpDelete("{messageId:int}")]
    public async Task<IActionResult> DeleteMessage(int messageId)
    {
        var userId = GetUserId();
        var (ok, error) = await _service.DeleteMessageAsync(userId, messageId);

        if (!ok)
        {
            if (error.Contains("own messages", StringComparison.OrdinalIgnoreCase))
                return Forbid();
            if (error.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new { message = error });
            return BadRequest(new { message = error });
        }

        return NoContent();
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
