using System.Net.Mail;

namespace PersonalLibrary.Api.Modules.Newsletter;

public class NewsletterStore
{
    private readonly object _sync = new();
    private readonly List<NewsletterSubscriberDto> _items = new();
    private int _nextId = 1;

    public IReadOnlyList<NewsletterSubscriberDto> GetAll()
    {
        lock (_sync)
        {
            return _items
                .OrderByDescending(x => x.UpdatedAt)
                .ToList();
        }
    }

    public (bool ok, string? error, NewsletterSubscriberDto? item) Add(string email)
    {
        var normalized = NormalizeEmail(email);
        if (normalized == null) return (false, "Invalid email address.", null);

        lock (_sync)
        {
            if (_items.Any(x => x.Email.Equals(normalized, StringComparison.OrdinalIgnoreCase)))
            {
                return (false, "Email already exists.", null);
            }

            var now = DateTime.UtcNow;
            var created = new NewsletterSubscriberDto(_nextId++, normalized, now, now);
            _items.Add(created);
            return (true, null, created);
        }
    }

    public (bool ok, string? error, NewsletterSubscriberDto? item) Update(int id, string email)
    {
        var normalized = NormalizeEmail(email);
        if (normalized == null) return (false, "Invalid email address.", null);

        lock (_sync)
        {
            var idx = _items.FindIndex(x => x.Id == id);
            if (idx < 0) return (false, "Subscriber not found.", null);

            if (_items.Any(x => x.Id != id && x.Email.Equals(normalized, StringComparison.OrdinalIgnoreCase)))
            {
                return (false, "Email already exists.", null);
            }

            var prev = _items[idx];
            var updated = prev with { Email = normalized, UpdatedAt = DateTime.UtcNow };
            _items[idx] = updated;
            return (true, null, updated);
        }
    }

    public bool Delete(int id)
    {
        lock (_sync)
        {
            var idx = _items.FindIndex(x => x.Id == id);
            if (idx < 0) return false;
            _items.RemoveAt(idx);
            return true;
        }
    }

    private static string? NormalizeEmail(string value)
    {
        var email = value?.Trim();
        if (string.IsNullOrWhiteSpace(email)) return null;

        try
        {
            var addr = new MailAddress(email);
            return addr.Address.Trim().ToLowerInvariant();
        }
        catch
        {
            return null;
        }
    }
}

public record NewsletterSubscriberDto(int Id, string Email, DateTime CreatedAt, DateTime UpdatedAt);

