using Microsoft.AspNetCore.Mvc;

namespace PersonalLibrary.Api.Modules.Newsletter;

[ApiController]
[Route("api/newsletter")]
public class NewsletterController : ControllerBase
{
    private readonly NewsletterStore _store;

    public NewsletterController(NewsletterStore store)
    {
        _store = store;
    }

    [HttpPost("subscribe")]
    public IActionResult Subscribe([FromBody] NewsletterUpsertDto dto)
    {
        var result = _store.Add(dto.Email);
        if (!result.ok) return BadRequest(result.error);
        return Ok(result.item);
    }
}

public class NewsletterUpsertDto
{
    public string Email { get; set; } = string.Empty;
}

