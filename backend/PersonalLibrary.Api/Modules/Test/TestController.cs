using Microsoft.AspNetCore.Mvc;

namespace PersonalLibrary.Api.Modules.Test;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    [HttpGet("ping")]
    public IActionResult Ping() => Ok("pong");
}
