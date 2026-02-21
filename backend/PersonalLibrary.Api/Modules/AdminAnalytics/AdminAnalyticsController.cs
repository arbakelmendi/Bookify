using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalLibrary.Api.Data;

namespace PersonalLibrary.Api.Modules.AdminAnalytics;

[ApiController]
[Route("api/admin/analytics")]
[Authorize(Roles = "admin,Admin")]
public class AdminAnalyticsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminAnalyticsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("activity")]
    public async Task<IActionResult> GetActivity([FromQuery] int days = 7)
    {
        if (days < 1) days = 1;
        if (days > 60) days = 60;

        var today = DateTime.UtcNow.Date;
        var start = today.AddDays(-(days - 1));

        var ratingRows = await _db.BookRatings
            .AsNoTracking()
            .Where(x => (x.UpdatedAt ?? x.CreatedAt) >= start)
            .Select(x => new
            {
                Date = (x.UpdatedAt ?? x.CreatedAt).Date,
                x.UserId
            })
            .ToListAsync();

        var readingRows = await _db.UserBooks
            .AsNoTracking()
            .Where(x => x.LastUpdated >= start)
            .Select(x => new
            {
                Date = x.LastUpdated.Date,
                x.UserId
            })
            .ToListAsync();

        var result = new List<object>();
        var activeUsers7d = new HashSet<int>();
        var reviewEvents7d = 0;
        var readingEvents7d = 0;

        for (var i = 0; i < days; i++)
        {
            var day = start.AddDays(i);
            var dayRatings = ratingRows.Where(x => x.Date == day).ToList();
            var dayReading = readingRows.Where(x => x.Date == day).ToList();

            var userSet = new HashSet<int>(dayRatings.Select(x => x.UserId));
            userSet.UnionWith(dayReading.Select(x => x.UserId));

            foreach (var userId in userSet) activeUsers7d.Add(userId);
            reviewEvents7d += dayRatings.Count;
            readingEvents7d += dayReading.Count;

            result.Add(new
            {
                date = day.ToString("yyyy-MM-dd"),
                label = day.ToString("ddd"),
                activeUsers = userSet.Count,
                reviewEvents = dayRatings.Count,
                readingEvents = dayReading.Count,
                totalEvents = dayRatings.Count + dayReading.Count
            });
        }

        return Ok(new
        {
            days,
            items = result,
            totals = new
            {
                activeUsers = activeUsers7d.Count,
                reviewEvents = reviewEvents7d,
                readingEvents = readingEvents7d,
                totalEvents = reviewEvents7d + readingEvents7d
            }
        });
    }
}
