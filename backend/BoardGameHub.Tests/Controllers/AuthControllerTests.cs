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
}
