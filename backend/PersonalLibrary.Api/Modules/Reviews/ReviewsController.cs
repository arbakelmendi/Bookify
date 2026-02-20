using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalLibrary.Api.Modules.Reviews.Dtos;

namespace PersonalLibrary.Api.Modules.Reviews;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReviewsController : ControllerBase
{
    private readonly ReviewsService _service;

    public ReviewsController(ReviewsService service)
    {
        _service = service;
    }

    [AllowAnonymous]
    [HttpGet("book/{bookId:int}")]
    public async Task<IActionResult> GetByBook(int bookId)
        => Ok(await _service.GetByBookAsync(bookId));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertReviewDto dto)
    {
        var userId = GetUserId();
        return Ok(await _service.CreateAsync(userId, dto));
    }

    [HttpDelete("{reviewId:int}/mine")]
    public async Task<IActionResult> DeleteMineById(int reviewId)
    {
        var userId = GetUserId();
        var deleted = await _service.DeleteMineByIdAsync(userId, reviewId);
        return deleted ? NoContent() : NotFound();
    }

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