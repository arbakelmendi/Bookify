using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using PersonalLibrary.Api.Modules.Reading.Dtos;
using Microsoft.AspNetCore.Authorization;

namespace PersonalLibrary.Api.Modules.Reading;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ReadingController : ControllerBase
{
    private readonly ReadingService _service;

    public ReadingController(ReadingService service)
    {
        _service = service;
    }

    /* ================= GET ================= */

    // GET /api/Reading/my
    [HttpGet("my")]
    public async Task<IActionResult> My()
    {
        var userId = GetUserId();
        var data = await _service.GetAllAsync(userId);
        return Ok(data);
    }

    // GET /api/Reading/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var userId = GetUserId();
        var data = await _service.GetByIdAsync(id, userId);
        if (data == null) return NotFound();
        return Ok(data);
    }

    // GET /api/Reading/current
    [HttpGet("current")]
    public async Task<IActionResult> Current()
    {
        var userId = GetUserId();
        var data = await _service.GetCurrentAsync(userId);
        return Ok(data);
    }

    // GET /api/Reading/finished
    [HttpGet("finished")]
    public async Task<IActionResult> Finished()
    {
        var userId = GetUserId();
        var data = await _service.GetFinishedAsync(userId);
        return Ok(data);
    }

    // GET /api/Reading/book/{bookId}/progress
    [HttpGet("book/{bookId:int}/progress")]
    public async Task<IActionResult> GetPdfProgress(int bookId)
    {
        var userId = GetUserId();
        var data = await _service.GetPdfProgressAsync(userId, bookId);
        if (data == null) return NotFound();
        return Ok(data);
    }

    /* ================= START ================= */

    // POST /api/Reading/start
    [HttpPost("start")]
    public async Task<IActionResult> Start([FromBody] StartReadingDto dto)
    {
        var userId = GetUserId();
        var created = await _service.StartAsync(userId, dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /* ================= UPDATE PROGRESS ================= */

    // PUT /api/Reading/{id}/progress
    [HttpPut("{id:int}/progress")]
    public async Task<IActionResult> UpdateProgress(int id, [FromBody] UpdateProgressDto dto)
    {
        var userId = GetUserId();
        var ok = await _service.UpdateProgressAsync(id, userId, dto);
        if (!ok) return NotFound();
        return NoContent();
    }

    // PUT /api/Reading/book/{bookId}/progress
    [HttpPut("book/{bookId:int}/progress")]
    public async Task<IActionResult> UpsertPdfProgress(int bookId, [FromBody] UpdatePdfProgressDto dto)
    {
        var userId = GetUserId();
        var result = await _service.UpsertPdfProgressAsync(userId, bookId, dto);

        if (result.missingTotalPages)
        {
            return BadRequest("TotalPages must be provided and > 0 when creating progress.");
        }

        if (result.created && result.dto != null)
        {
            return CreatedAtAction(nameof(GetPdfProgress), new { bookId }, result.dto);
        }

        return NoContent();
    }

    /* ================= MARK FINISHED ================= */

    // PUT /api/Reading/{id}/finish
    [HttpPut("{id:int}/finish")]
    public async Task<IActionResult> Finish(int id)
    {
        var userId = GetUserId();
        var ok = await _service.MarkFinishedAsync(id, userId);
        if (!ok) return NotFound();
        return NoContent();
    }

    /* ================= DELETE ================= */

    // DELETE /api/Reading/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetUserId();
        var ok = await _service.DeleteAsync(id, userId);
        if (!ok) return NotFound();
        return NoContent();
    }

    /* ================= HELPER ================= */

        private int GetUserId()
    {
        var idStr =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub") ??
            User.FindFirstValue("userId") ??
            User.FindFirstValue("id");

        if (string.IsNullOrWhiteSpace(idStr))
            throw new UnauthorizedAccessException("Missing user id claim.");

        if (!int.TryParse(idStr, out var userId))
            throw new UnauthorizedAccessException($"Invalid user id claim: {idStr}");

        return userId;
    }

}
