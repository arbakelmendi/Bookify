using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalLibrary.Api.Modules.Recommendations.Dtos;

namespace PersonalLibrary.Api.Modules.Recommendations;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RecommendationsController : ControllerBase
{
    private readonly RecommendationService _service;

    public RecommendationsController(RecommendationService service)
    {
        _service = service;
    }

    // POST: /api/Recommendations
    [HttpPost]
    public async Task<IActionResult> Send([FromBody] SendRecommendationDto dto)
    {
        var userId = GetUserId();
        var (ok, error, data) = await _service.SendAsync(userId, dto);

        if (!ok)
        {
            // friends rule
            if (error.Contains("not friends", StringComparison.OrdinalIgnoreCase))
                return StatusCode(StatusCodes.Status403Forbidden, new { message = error });

            // not found
            if (error.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new { message = error });

            // everything else
            return BadRequest(new { message = error });
        }

        return Ok(data);
    }

    // GET: /api/Recommendations/inbox
    [HttpGet("inbox")]
    public async Task<IActionResult> Inbox()
    {
        var userId = GetUserId();
        var data = await _service.InboxAsync(userId);
        return Ok(data);
    }

    // GET: /api/Recommendations/sent
    [HttpGet("sent")]
    public async Task<IActionResult> Sent()
    {
        var userId = GetUserId();
        var data = await _service.SentAsync(userId);
        return Ok(data);
    }

    // POST: /api/Recommendations/{id}/accept
    [HttpPost("{id:int}/accept")]
    public async Task<IActionResult> Accept([FromRoute] int id)
    {
        var userId = GetUserId();
        var (ok, error) = await _service.AcceptAsync(userId, id);

        if (!ok)
        {
            if (error.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new { message = error });

            if (error.Contains("only accept", StringComparison.OrdinalIgnoreCase) ||
                error.Contains("not allowed", StringComparison.OrdinalIgnoreCase))
                return StatusCode(StatusCodes.Status403Forbidden, new { message = error });

            return BadRequest(new { message = error });
        }

        return Ok(new { ok = true });
    }

    // DELETE: /api/Recommendations/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete([FromRoute] int id)
    {
        var userId = GetUserId();
        var (ok, error) = await _service.DeleteAsync(userId, id);

        if (!ok)
        {
            if (error.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new { message = error });

            if (error.Contains("not allowed", StringComparison.OrdinalIgnoreCase))
                return StatusCode(StatusCodes.Status403Forbidden, new { message = error });

            return BadRequest(new { message = error });
        }

        return Ok(new { ok = true });
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
