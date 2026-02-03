
using Microsoft.EntityFrameworkCore;
using PersonalLibrary.Api.Modules.Ratings;
using PersonalLibrary.Api.Data;
using PersonalLibrary.Api.Models;
using PersonalLibrary.Api.Modules.Auth;
using PersonalLibrary.Api.Modules.Friends;
using PersonalLibrary.Api.Modules.Reading;
using PersonalLibrary.Api.Modules.Authors;
using PersonalLibrary.Api.Modules.Categories;
using Microsoft.Extensions.Logging;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
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
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() 
    { 
        Title = "PersonalLibrary.Api", 
        Version = "v1" 
    });

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
builder.Services.AddScoped<FriendService>();
builder.Services.AddScoped<ReadingService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<RatingsService>();
builder.Services.AddScoped<AuthorsService>();
builder.Services.AddScoped<CategoriesService>();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));


builder.Services.AddHttpClient<PersonalLibrary.Api.Services.GoogleBooksService>();


var app = builder.Build();

// Seed admin user
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();

    // Check if admin user exists
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

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("Frontend");

// Auth disabled

app.MapControllers();

app.Run();
