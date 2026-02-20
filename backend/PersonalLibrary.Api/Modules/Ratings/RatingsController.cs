using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalLibrary.Api.Modules.Ratings.Dtos;

namespace PersonalLibrary.Api.Modules.Ratings;

[ApiController]
[Route("api/[controller]")]
public class RatingsController : ControllerBase
{
    private readonly RatingsService _service;

    public RatingsController(RatingsService service)
    {
        _service = service;
    }

    [AllowAnonymous]
    [HttpGet("book/{bookId:int}/summary")]
    public async Task<IActionResult> Summary(int bookId)
        => Ok(await _service.GetSummaryAsync(bookId));

    [Authorize]
    [HttpGet("book/{bookId:int}/mine")]
    public async Task<IActionResult> Mine(int bookId)
        => Ok(await _service.GetMineAsync(GetUserId(), bookId));

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Set([FromBody] SetRatingDto dto)
        => Ok(await _service.UpsertAsync(GetUserId(), dto));

    private int GetUserId()
    {
        var idStr =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        if (string.IsNullOrWhiteSpace(idStr))
            throw new UnauthorizedAccessException("Missing user id claim.");

        if (!int.TryParse(idStr, out var id))
            throw new UnauthorizedAccessException($"User id claim is not an int: '{idStr}'");

        return id;
    }
}