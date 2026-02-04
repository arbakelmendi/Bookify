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
            if (error.Contains("Only friends", StringComparison.OrdinalIgnoreCase))
                return Forbid();

            if (error.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new { message = error });

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
