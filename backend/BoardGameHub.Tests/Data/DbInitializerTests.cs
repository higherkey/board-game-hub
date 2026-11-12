using BoardGameHub.Api.Data;
using BoardGameHub.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace BoardGameHub.Tests.Data;

public class DbInitializerTests
{
    [Fact]
    public async Task SeedAsync_ShouldCreateAdminRoleButNoUser_WhenAdminConfigMissing()
    {
        var roleManager = new Mock<RoleManager<IdentityRole>>(
            new Mock<IRoleStore<IdentityRole>>().Object, null!, null!, null!, null!);
        roleManager.Setup(r => r.RoleExistsAsync("Admin")).ReturnsAsync(false);
        roleManager.Setup(r => r.CreateAsync(It.IsAny<IdentityRole>())).ReturnsAsync(IdentityResult.Success);

        var userManager = new Mock<UserManager<User>>(
            new Mock<IUserStore<User>>().Object, null!, null!, null!, null!, null!, null!, null!, null!);

        var services = new ServiceCollection()
            .AddSingleton(roleManager.Object)
            .AddSingleton(userManager.Object)
            .AddSingleton<IConfiguration>(new ConfigurationBuilder().Build())
            .BuildServiceProvider();

        await DbInitializer.SeedAsync(services);

        roleManager.Verify(r => r.CreateAsync(It.Is<IdentityRole>(x => x.Name == "Admin")), Times.Once);
        userManager.Verify(u => u.CreateAsync(It.IsAny<User>(), It.IsAny<string>()), Times.Never);
        userManager.Verify(u => u.CreateAsync(It.IsAny<User>()), Times.Never);
    }
}
