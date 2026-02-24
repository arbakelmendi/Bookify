using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PersonalLibrary.Api.Modules.Newsletter;

[ApiController]
[Route("api/admin/newsletter")]
[Authorize(Roles = "admin,Admin")]
public class AdminNewsletterController : ControllerBase
{
    private readonly NewsletterStore _store;

    public AdminNewsletterController(NewsletterStore store)
    {
        _store = store;
    }

    [HttpGet]
    public IActionResult GetAll()
    {
        return Ok(_store.GetAll());
    }

    [HttpPost]
    public IActionResult Create([FromBody] NewsletterUpsertDto dto)
    {
        var result = _store.Add(dto.Email);
        if (!result.ok) return BadRequest(result.error);
        return Ok(result.item);
    }

    [HttpPut("{id:int}")]
    public IActionResult Update(int id, [FromBody] NewsletterUpsertDto dto)
    {
        var result = _store.Update(id, dto.Email);
        if (!result.ok)
        {
            if (result.error == "Subscriber not found.") return NotFound(result.error);
            return BadRequest(result.error);
        }

        return Ok(result.item);
    }

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        var ok = _store.Delete(id);
        if (!ok) return NotFound("Subscriber not found.");
        return NoContent();
    }
}

