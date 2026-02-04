using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalLibrary.Api.Modules.Friends.Dtos;

namespace PersonalLibrary.Api.Modules.Friends;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FriendsController : ControllerBase
{
    private readonly FriendService _service;

    public FriendsController(FriendService service)
    {
        _service = service;
    }

    // GET: /api/Friends/incoming  (Pending only)
    [HttpGet("incoming")]
    public async Task<IActionResult> Incoming()
    {
        var userId = GetUserId();
        var data = await _service.GetIncomingAsync(userId);
        return Ok(data);
    }

    // GET: /api/Friends/outgoing (Pending only)
    [HttpGet("outgoing")]
    public async Task<IActionResult> Outgoing()
    {
        var userId = GetUserId();
        var data = await _service.GetOutgoingAsync(userId);
        return Ok(data);
    }

    // GET: /api/Friends/list (Accepted friends)
    [HttpGet("list")]
    public async Task<IActionResult> FriendsList()
    {
        var userId = GetUserId();
        var data = await _service.GetFriendsAsync(userId);
        return Ok(data);
    }

    // POST: /api/Friends/request
    [HttpPost("request")]
    public async Task<IActionResult> SendRequest([FromBody] SendFriendRequestDto dto)
    {
        var userId = GetUserId();
        var (ok, error, data) = await _service.SendRequestAsync(userId, dto.ReceiverId);

        if (!ok)
        {
            // 409: duplicates / already friends
            if (error.Contains("already", StringComparison.OrdinalIgnoreCase) ||
                error.Contains("pending", StringComparison.OrdinalIgnoreCase))
                return Conflict(new { message = error });

            // 404: receiver not found
            if (error.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new { message = error });

            // 400: self-request or validation
            return BadRequest(new { message = error });
        }

        // simplest: return created object
        return Ok(data);
    }

    // POST: /api/Friends/accept/{requestId}
    [HttpPost("accept/{requestId:int}")]
    public async Task<IActionResult> Accept(int requestId)
    {
        var userId = GetUserId();
        var (ok, error) = await _service.AcceptAsync(userId, requestId);

        if (!ok)
        {
            if (error.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new { message = error });

            if (error.Contains("not allowed", StringComparison.OrdinalIgnoreCase))
                return Forbid();

            return BadRequest(new { message = error });
        }

        return NoContent();
    }

    // POST: /api/Friends/reject/{requestId}
    [HttpPost("reject/{requestId:int}")]
    public async Task<IActionResult> Reject(int requestId)
    {
        var userId = GetUserId();
        var (ok, error) = await _service.RejectAsync(userId, requestId);

        if (!ok)
        {
            if (error.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new { message = error });

            if (error.Contains("not allowed", StringComparison.OrdinalIgnoreCase))
                return Forbid();

            return BadRequest(new { message = error });
        }

        return NoContent();
    }

    // DELETE: /api/Friends/cancel/{requestId}
    [HttpDelete("cancel/{requestId:int}")]
    public async Task<IActionResult> Cancel(int requestId)
    {
        var userId = GetUserId();
        var (ok, error) = await _service.CancelAsync(userId, requestId);

        if (!ok)
        {
            if (error.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new { message = error });

            if (error.Contains("not allowed", StringComparison.OrdinalIgnoreCase))
                return Forbid();

            return BadRequest(new { message = error });
        }

        return NoContent();
    }

    // DELETE: /api/Friends/remove/{friendId}
    [HttpDelete("remove/{friendId:int}")]
    public async Task<IActionResult> RemoveFriend(int friendId)
    {
        var userId = GetUserId();
        var (ok, error) = await _service.RemoveFriendAsync(userId, friendId);

        if (!ok)
        {
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
