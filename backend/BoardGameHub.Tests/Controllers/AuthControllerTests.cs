using System.Collections.Generic;
using System.Security.Claims;
using BoardGameHub.Api.Controllers;
using BoardGameHub.Api.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace BoardGameHub.Tests.Controllers;

public class AuthControllerTests
{
    private readonly Mock<UserManager<User>> _mockUserManager;
    private readonly Mock<SignInManager<User>> _mockSignInManager;
    private readonly Mock<IConfiguration> _mockConfig;
    private readonly AuthController _sut;

    public AuthControllerTests()
    {
        var store = new Mock<IUserStore<User>>();
        _mockUserManager = new Mock<UserManager<User>>(store.Object, null, null, null, null, null, null, null, null);

        var contextAccessor = new Mock<IHttpContextAccessor>();
        var claimsFactory = new Mock<IUserClaimsPrincipalFactory<User>>();
        _mockSignInManager = new Mock<SignInManager<User>>(_mockUserManager.Object, contextAccessor.Object, claimsFactory.Object, null, null, null, null);

        _mockConfig = new Mock<IConfiguration>();
        _mockConfig.Setup(c => c["Jwt:Key"]).Returns("SuperSecretKeyForTestingTheJwtTokenGeneration123!");

        _sut = new AuthController(_mockUserManager.Object, _mockSignInManager.Object, _mockConfig.Object);
    }

    [Fact]
    public async Task Register_ShouldCreateUser_WhenValid()
    {
        // Arrange
        var model = new RegisterDto { Email = "test@test.com", Password = "Password123!", DisplayName = "Tester" };
        _mockUserManager.Setup(u => u.CreateAsync(It.IsAny<User>(), model.Password))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        var result = await _sut.Register(model);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    }

    [Fact]
    public async Task Login_ShouldReturnToken_WhenCredentialsValid()
    {
        // Arrange
        var model = new LoginDto { Email = "test@test.com", Password = "Password123!" };
        var user = new User { Id = "u1", Email = model.Email, DisplayName = "Tester" };

        _mockSignInManager.Setup(s => s.PasswordSignInAsync(model.Email, model.Password, false, false))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);

        _mockUserManager.Setup(u => u.FindByEmailAsync(model.Email))
            .ReturnsAsync(user);

        // Act
        var result = await _sut.Login(model);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        // Verify token logic if needed
    }

    private void SetupUserClaim(string? userId)
    {
        var claims = new List<Claim>();
        if (userId != null)
        {
            claims.Add(new Claim(ClaimTypes.NameIdentifier, userId));
        }
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _sut.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };
    }

    [Fact]
    public async Task UpdateAvatar_ShouldReturnUnauthorized_WhenUserIdClaimMissing()
    {
        SetupUserClaim(null);

        var result = await _sut.UpdateAvatar(new UpdateAvatarDto { NewAvatarUrl = "new-url" });

        result.Should().BeOfType<UnauthorizedResult>();
    }

    [Fact]
    public async Task UpdateAvatar_ShouldReturnNotFound_WhenUserDoesNotExist()
    {
        SetupUserClaim("missing-id");
        _mockUserManager.Setup(u => u.FindByIdAsync("missing-id")).ReturnsAsync((User?)null);

        var result = await _sut.UpdateAvatar(new UpdateAvatarDto { NewAvatarUrl = "new-url" });

        var notFound = result.Should().BeOfType<NotFoundObjectResult>().Subject;
        notFound.Value.Should().Be("User not found.");
    }

    [Fact]
    public async Task UpdateAvatar_ShouldReturnOkWithNewToken_WhenValid()
    {
        SetupUserClaim("valid-id");
        var user = new User { Id = "valid-id", Email = "a@a.com", DisplayName = "Alice", AvatarUrl = "old-url" };
        
        _mockUserManager.Setup(u => u.FindByIdAsync("valid-id")).ReturnsAsync(user);
        _mockUserManager.Setup(u => u.UpdateAsync(user)).ReturnsAsync(IdentityResult.Success);

        var result = await _sut.UpdateAvatar(new UpdateAvatarDto { NewAvatarUrl = "new-url" });

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        user.AvatarUrl.Should().Be("new-url");
        
        // Verify response contains Token and User with updated avatar
        var responseProps = okResult.Value!.GetType().GetProperties();
        var tokenProp = responseProps.First(p => p.Name == "Token").GetValue(okResult.Value);
        var userProp = responseProps.First(p => p.Name == "User").GetValue(okResult.Value);
        
        tokenProp.Should().NotBeNull();
        
        var userReflectedProps = userProp!.GetType().GetProperties();
        var avatarProp = userReflectedProps.First(p => p.Name == "AvatarUrl").GetValue(userProp);
        avatarProp.Should().Be("new-url");
    }

    [Fact]
    public async Task UpdateAvatar_ShouldReturnBadRequest_WhenUpdateFails()
    {
        SetupUserClaim("valid-id");
        var user = new User { Id = "valid-id", Email = "a@a.com", DisplayName = "Alice", AvatarUrl = "old-url" };
        
        _mockUserManager.Setup(u => u.FindByIdAsync("valid-id")).ReturnsAsync(user);
        _mockUserManager.Setup(u => u.UpdateAsync(user)).ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Update failed" }));

        var result = await _sut.UpdateAvatar(new UpdateAvatarDto { NewAvatarUrl = "new-url" });

        result.Should().BeOfType<BadRequestObjectResult>();
    }
}
