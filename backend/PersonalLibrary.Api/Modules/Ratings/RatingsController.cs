using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalLibrary.Api.Modules.Ratings.Dtos;

namespace PersonalLibrary.Api.Modules.Ratings;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RatingsController : ControllerBase
{
    private readonly RatingsService _service;

    public RatingsController(RatingsService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<IActionResult> Rate([FromBody] CreateRatingDto dto)
    {
        var userId = GetUserId();
        var result = await _service.RateAsync(userId, dto);
        return Ok(result);
    }

    [HttpGet("book/{bookId:int}")]
    public async Task<IActionResult> GetByBook(int bookId)
    {
        var data = await _service.GetByBookAsync(bookId);
        return Ok(data);
    }

    [HttpGet("book/{bookId:int}/average")]
    public async Task<IActionResult> GetAverage(int bookId)
    {
        var avg = await _service.GetAverageAsync(bookId);
        return Ok(new { average = avg });
    }

    private int GetUserId()
    {
        var id =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        return int.Parse(id!);
    }
}
