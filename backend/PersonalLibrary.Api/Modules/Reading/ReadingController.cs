using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalLibrary.Api.Modules.Reading.Dtos;

namespace PersonalLibrary.Api.Modules.Reading;

[ApiController]
[Route("api/[controller]")]
public class ReadingController : ControllerBase
{
    private readonly ReadingService _service;

    public ReadingController(ReadingService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetUserId();
        var data = await _service.GetAllAsync(userId);
        return Ok(data);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var userId = GetUserId();
        var data = await _service.GetByIdAsync(id, userId);
        if (data == null) return NotFound();
        return Ok(data);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReadingDto dto)
    {
        var userId = GetUserId();
        var created = await _service.CreateAsync(userId, dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateReadingDto dto)
    {
        var userId = GetUserId();
        var ok = await _service.UpdateAsync(id, userId, dto);
        if (!ok) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetUserId();
        var ok = await _service.DeleteAsync(id, userId);
        if (!ok) return NotFound();
        return NoContent();
    }

    private int GetUserId()
    {
        var idStr =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        return int.Parse(idStr!);
    }
}
