using BoardGameHub.Api.Hubs;
using BoardGameHub.Api.Services;
using BoardGameHub.Api.Data;
using BoardGameHub.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Database Context
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Identity
builder.Services.AddIdentity<User, IdentityRole>(options => {
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "super_secret_key_12345_make_it_long_enough";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };

    // SignalR Token Handling
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && 
               (path.StartsWithSegments("/gamehub") || 
                path.StartsWithSegments("/socialhub") || 
                path.StartsWithSegments("/adminhub")))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddSignalR()
    .AddJsonProtocol(options => {
        options.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddSingleton<RoomService>();
builder.Services.AddSingleton<IBabbleService, BabbleService>();
builder.Services.AddSingleton<BabbleService>(sp => (BabbleService)sp.GetRequiredService<IBabbleService>()); // Allow resolving concrete too if generic needed
builder.Services.AddSingleton<DeepfakeGameService>();
// Register Game Services
builder.Services.AddSingleton<IGameService, ScatterbrainGameService>();
builder.Services.AddSingleton<IGameService, BabbleGameService>();
builder.Services.AddSingleton<IGameService, OneAndOnlyService>();
builder.Services.AddSingleton<IGameService, BreakingNewsGameService>();
builder.Services.AddSingleton<IGameService, UniversalTranslatorService>();
builder.Services.AddSingleton<IGameService, SymbologyGameService>();
builder.Services.AddSingleton<IGameService, PictophoneService>();
builder.Services.AddSingleton<IGameService, WisecrackGameService>();
builder.Services.AddSingleton<IGameService, SushiTrainGameService>();
builder.Services.AddSingleton<IGameService, BoardGameHub.Api.Services.Games.GreatMinds.GreatMindsGameService>();

// Persistence Services (Scoped because they use DbContext)
builder.Services.AddScoped<SocialService>();
builder.Services.AddScoped<GameHistoryService>();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:4200") // Angular default port
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Required for SignalR
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();
    }
}


app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<GameHub>("/gamehub");
app.MapHub<SocialHub>("/socialhub");
app.MapHub<AdminHub>("/adminhub");
app.MapFallbackToFile("index.html");

app.Run();
