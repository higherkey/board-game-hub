using BoardGameHub.Api.Hubs;
using BoardGameHub.Api.Services;
using BoardGameHub.Api.Services.Games;
using BoardGameHub.Api.Data;
using BoardGameHub.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Render supplies PORT; otherwise honor launch profiles, ASPNETCORE_URLS and container defaults.
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(port))
{
    // Render terminates public TLS at its edge; bind the internal listener explicitly.
    builder.WebHost.ConfigureKestrel(options => options.Listen(System.Net.IPAddress.Any,
        int.Parse(port, System.Globalization.CultureInfo.InvariantCulture)));
}

// Ensure hosted services run concurrently and do not block Kestrel socket binding
builder.Services.Configure<HostOptions>(options =>
{
    options.ServicesStartConcurrently = true;
    options.ServicesStopConcurrently = true;
});
builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("../logs/backend.log", rollingInterval: RollingInterval.Day)
    .WriteTo.Logger(lc => lc
        .Filter.ByIncludingOnly(evt => evt.Properties.ContainsKey("SourceContext") && evt.Properties["SourceContext"].ToString().Contains("ClientLogging"))
        .WriteTo.File("../logs/frontend.log", rollingInterval: RollingInterval.Day))
);

// Add services to the container.
// Database Context
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = ConnectionStringHelper.Normalize(builder.Configuration.GetConnectionString("DefaultConnection"));
    if (string.IsNullOrEmpty(connectionString) || connectionString.StartsWith("InMemory", StringComparison.OrdinalIgnoreCase))
    {
        options.UseInMemoryDatabase(string.IsNullOrEmpty(connectionString) ? "BoardGameHubInMemory" : connectionString);
    }
    else
    {
        options.UseNpgsql(connectionString);
    }
});

// Identity
builder.Services.AddIdentity<User, IdentityRole>(options => {
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.AllowedForNewUsers = true;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddRoles<IdentityRole>()
.AddDefaultTokenProviders();

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrEmpty(jwtKey))
{
    throw new InvalidOperationException("Jwt:Key is missing from configuration.");
}
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
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "BoardGameHub",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "BoardGameHubUsers",
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

// Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.AddSlidingWindowLimiter("HubRateLimit", opt =>
    {
        opt.PermitLimit = 100;
        opt.Window = TimeSpan.FromSeconds(10);
        opt.SegmentsPerWindow = 5;
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 20;
    });

    // Per-client throttle for the anonymous client log endpoint (ClientLoggingController).
    options.AddPolicy("ClientLoggingLimiter", httpContext =>
        System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

builder.Services.AddSingleton<IRoomService>(sp => new RoomService(
    sp.GetServices<IGameService>(),
    sp.GetRequiredService<Microsoft.AspNetCore.SignalR.IHubContext<BoardGameHub.Api.Hubs.AdminHub>>(),
    sp.GetRequiredService<Microsoft.AspNetCore.SignalR.IHubContext<BoardGameHub.Api.Hubs.GameHub>>(),
    sp.GetRequiredService<GameStateManager>(),
    sp.GetRequiredService<ILogger<RoomService>>(),
    sp.GetRequiredService<IServiceScopeFactory>(),
    sp.GetRequiredService<IRoomPersistenceService>(),
    sp.GetRequiredService<IRoomStateSerializer>()
));
builder.Services.AddSingleton<IBabbleService, BabbleService>();
builder.Services.AddSingleton<BabbleService>(sp => (BabbleService)sp.GetRequiredService<IBabbleService>()); // Allow resolving concrete too if generic needed
builder.Services.AddSingleton<IDictionaryService, DictionaryService>();
// Register Game Services
builder.Services.AddSingleton<IGameService, DeepfakeGameService>();
builder.Services.AddSingleton<DeepfakeGameService>(sp => (DeepfakeGameService)sp.GetServices<IGameService>().First(s => s is DeepfakeGameService));
builder.Services.AddSingleton<IGameService, ScatterbrainGameService>();
builder.Services.AddSingleton<IGameService, BabbleGameService>();
builder.Services.AddSingleton<IGameService, OneAndOnlyService>();
builder.Services.AddSingleton<IGameService, BreakingNewsGameService>();
builder.Services.AddSingleton<IGameService, UniversalTranslatorService>();
builder.Services.AddSingleton<IGameService, SymbologyGameService>();
builder.Services.AddSingleton<IGameService, PictophoneService>();
builder.Services.AddSingleton<IGameService, WisecrackGameService>();
builder.Services.AddSingleton<IGameService, SushiTrainGameService>();
builder.Services.AddSingleton<IGameService, GreatMindsGameService>();
builder.Services.AddSingleton<IGameService, PoppycockGameService>();
builder.Services.AddSingleton<IGameService, NomDeCodeService>();
builder.Services.AddSingleton<IGameService, WarshipsGameService>();
builder.Services.AddSingleton<IGameService, FourInARowGameService>();
builder.Services.AddSingleton<IGameService, CloverMindedGameService>();
builder.Services.AddSingleton<IGameService, FarkleService>();
builder.Services.AddSingleton<IGameService, YachtGameService>();

// Server Authority Services
builder.Services.AddSingleton<StateDiffService>();
builder.Services.AddSingleton<IRoomStateSerializer, RoomStateSerializer>();
builder.Services.AddSingleton<GameStateManager>(sp => new GameStateManager(
    sp.GetRequiredService<Microsoft.AspNetCore.SignalR.IHubContext<BoardGameHub.Api.Hubs.GameHub>>(),
    sp.GetRequiredService<StateDiffService>(),
    sp.GetRequiredService<ILogger<GameStateManager>>(),
    sp.GetRequiredService<IRoomPersistenceService>(),
    sp.GetRequiredService<IRoomStateSerializer>()
));
builder.Services.AddHostedService(sp => sp.GetRequiredService<GameStateManager>());

// Room Persistence Engine
// Dependency graph must stay acyclic: RoomService -> GameStateManager -> RoomPersistenceWorker.
// The worker is built with its lean constructor and resolves IRoomService/GameStateManager lazily
// (per scope) when it rehydrates or cleans up, so it never depends on them at construction time.
// Do NOT switch this to AddSingleton<RoomPersistenceWorker>(): MS DI would pick the greedy constructor
// and reintroduce the RoomService <-> RoomPersistenceWorker cycle that hung startup (#213, #214).
builder.Services.AddSingleton(sp => new RoomPersistenceWorker(
    sp.GetRequiredService<IServiceScopeFactory>(),
    sp.GetRequiredService<IRoomStateSerializer>(),
    sp.GetServices<IGameService>(),
    sp.GetRequiredService<ILogger<RoomPersistenceWorker>>()
));
builder.Services.AddSingleton<IRoomPersistenceService>(sp => sp.GetRequiredService<RoomPersistenceWorker>());
if (!string.Equals(builder.Configuration["Testing:DisablePersistenceWorker"], "true", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddHostedService(sp => sp.GetRequiredService<RoomPersistenceWorker>());
}

// Persistence Services (Scoped because they use DbContext)
builder.Services.AddScoped<ISocialService, SocialService>();
builder.Services.AddScoped<IGameHistoryService, GameHistoryService>();

// Configure OpenAPI (.NET 10)
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin => 
            origin.StartsWith("http://localhost:") || 
            origin.EndsWith(".vercel.app") ||
            origin.EndsWith(".onrender.com") ||
            origin.EndsWith(".pages.dev") ||
            origin.EndsWith(".eight1fivedesign.com")
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials(); // Required for SignalR
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Initialize database: Seed roles and admin user (Migrations are managed out-of-band)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (db.Database.ProviderName != null && db.Database.ProviderName.Contains("InMemory"))
    {
        db.Database.EnsureCreated();
    }
    
    // Seed Roles and Admin User
    await DbInitializer.SeedAsync(scope.ServiceProvider);
}


app.UseDefaultFiles();
app.UseStaticFiles();

// Health check endpoint for Render / uptime monitoring and the frontend cold-start warmup (#191).
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

// Redirect root to admin dashboard
app.MapGet("/", () => Results.Redirect("/admin"));

app.UseCors("AllowFrontend");

app.UseRateLimiter();


app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<GameHub>("/gamehub").RequireRateLimiting("HubRateLimit");
app.MapHub<SocialHub>("/socialhub");
app.MapHub<AdminHub>("/adminhub")
    .RequireRateLimiting("HubRateLimit")
    .RequireAuthorization(p => p.RequireRole("Admin"));


app.MapFallbackToFile("index.html");

var lifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();
lifetime.ApplicationStarted.Register(() =>
{
    var server = app.Services.GetRequiredService<Microsoft.AspNetCore.Hosting.Server.IServer>();
    var addresses = server.Features.Get<Microsoft.AspNetCore.Hosting.Server.Features.IServerAddressesFeature>()?.Addresses;
    Log.Information("=== [HostLifetime] Kestrel successfully started! Bound addresses: {Addresses} ===", string.Join(", ", addresses ?? Array.Empty<string>()));
});
lifetime.ApplicationStopping.Register(() => Log.Warning("=== [HostLifetime] ApplicationStopping triggered! Stack trace: {StackTrace} ===", Environment.StackTrace));
lifetime.ApplicationStopped.Register(() => Log.Warning("=== [HostLifetime] ApplicationStopped completed. ==="));

try
{
    Log.Information("=== [HostLifetime] Starting application... ===");
    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "=== [HostLifetime] Unhandled exception terminated server startup ===");
    throw;
}

public partial class Program { }

