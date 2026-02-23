using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using PersonalLibrary.Api.Data;
using PersonalLibrary.Api.Models;
using PersonalLibrary.Api.Modules.Auth;
using PersonalLibrary.Api.Modules.Authors;
using PersonalLibrary.Api.Modules.Categories;
using PersonalLibrary.Api.Modules.Friends;
using PersonalLibrary.Api.Modules.Ratings;
using PersonalLibrary.Api.Modules.Reading;
using System.Text;
using PersonalLibrary.Api.Modules.Recommendations;
using PersonalLibrary.Api.Modules.Notifications;
using PersonalLibrary.Api.Modules.Reviews;
using PersonalLibrary.Api.Modules.Messages;


var builder = WebApplication.CreateBuilder(args);

// Controllers + Swagger
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "PersonalLibrary.Api",
        Version = "v1"
    });

    // Swagger Bearer
    c.AddSecurityDefinition("Bearer", new()
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Shkruaj: Bearer {token}"
    });

    c.AddSecurityRequirement(new()
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", p =>
        p.WithOrigins(
                "http://localhost:8080",
                "http://localhost:5173",
                "https://localhost:5173"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
    );
});

// DI Services
builder.Services.AddScoped<FriendService>();
builder.Services.AddScoped<ReadingService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<RatingsService>();
builder.Services.AddScoped<AuthorsService>();
builder.Services.AddScoped<CategoriesService>();
builder.Services.AddScoped<RecommendationService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddScoped<ReviewsService>();
builder.Services.AddScoped<MessageService>();


// DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// HttpClient
builder.Services.AddHttpClient<PersonalLibrary.Api.Services.GoogleBooksService>();

// ✅ JWT Authentication + Authorization
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)
        )
    };
    // Allow SignalR to read token from query string
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                context.Token = accessToken;
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

Console.WriteLine("ENV: " + builder.Environment.EnvironmentName);
Console.WriteLine("JWT Issuer: " + builder.Configuration["Jwt:Issuer"]);
Console.WriteLine("JWT Audience: " + builder.Configuration["Jwt:Audience"]);
Console.WriteLine("JWT Key length: " + (builder.Configuration["Jwt:Key"]?.Length ?? 0));
var app = builder.Build();

// ✅ Seed admin user
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();

    var adminEmail = "admin@bookify.com";
    var adminExists = await context.Users.AnyAsync(u => u.Email.ToLower() == adminEmail.ToLower());

    if (!adminExists)
    {
        var adminUser = new User
        {
            Email = adminEmail,
            Username = "admin",
            Role = "admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123")
        };

        context.Users.Add(adminUser);
        await context.SaveChangesAsync();
    }
}

// ✅ Seed books (dev only)
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();
    var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("DbSeeder");

    try
    {
        var canConnect = await context.Database.CanConnectAsync();
        if (!canConnect)
        {
            logger.LogWarning("Skipping book seeding: database is not reachable.");
        }
        else
        {
            await DbSeeder.SeedAsync(context, logger);
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error during book seeding.");
    }
}

// Middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("Frontend");

app.UseAuthentication(); // ✅ MUST be before UseAuthorization
app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

app.Run();
