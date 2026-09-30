using BoardGameHub.Api.Hubs;
using BoardGameHub.Api.Services;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Moq;
using Xunit;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Models.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BoardGameHub.Tests.Hubs;

public class SocialHubTests
{
    private readonly Mock<ISocialService> _mockSocialService;
    private readonly SocialHub _sut;
    private readonly Mock<IHubCallerClients> _mockClients;
    private readonly Mock<IClientProxy> _mockClientProxy;
    private readonly Mock<HubCallerContext> _mockContext;

    public SocialHubTests()
    {
        _mockSocialService = new Mock<ISocialService>();
        _sut = new SocialHub(_mockSocialService.Object);

        _mockClients = new Mock<IHubCallerClients>();
        _mockClientProxy = new Mock<IClientProxy>();
        
        _mockClients.Setup(c => c.User(It.IsAny<string>())).Returns(_mockClientProxy.Object);
        _mockClients.Setup(c => c.All).Returns(_mockClientProxy.Object);
        _sut.Clients = _mockClients.Object;

        _mockContext = new Mock<HubCallerContext>();
        _mockContext.Setup(c => c.UserIdentifier).Returns("user123");
        _sut.Context = _mockContext.Object;
    }

    [Fact]
    public async Task SendMessage_ShouldSaveAndBroadcast()
    {
        // Act
        await _sut.SendMessage("target123", "Hello!");

        // Assert
        _mockSocialService.Verify(s => s.SaveChatMessage("user123", "target123", "Hello!"), Times.Once);
        _mockClientProxy.Verify(c => c.SendCoreAsync("ReceiveMessage", new object[] { "user123", "Hello!" }, default), Times.Once);
    }

    [Fact]
    public async Task SendGlobalMessage_ShouldSaveAndBroadcast()
    {
        // Act
        await _sut.SendGlobalMessage("Global hello!");

        // Assert
        _mockSocialService.Verify(s => s.SaveGlobalMessage("user123", "Global hello!"), Times.Once);
        _mockClientProxy.Verify(c => c.SendCoreAsync("ReceiveGlobalMessage", new object[] { "user123", "Global hello!" }, default), Times.Once);
    }

    [Fact]
    public async Task SendFriendRequest_ShouldSendAndBroadcast()
    {
        // Act
        await _sut.SendFriendRequest("target123");

        // Assert
        _mockSocialService.Verify(s => s.SendFriendRequest("user123", "target123"), Times.Once);
        _mockClientProxy.Verify(c => c.SendCoreAsync("ReceiveFriendRequest", new object[] { "user123" }, default), Times.Once);
    }
    [Fact]
    public async Task AcceptFriendRequest_ShouldCallServiceAndBroadcast()
    {
        // Act
        await _sut.AcceptFriendRequest("requester123");

        // Assert
        _mockSocialService.Verify(s => s.AcceptFriendRequest("requester123", "user123"), Times.Once);
        _mockClientProxy.Verify(c => c.SendCoreAsync("FriendRequestAccepted", new object[] { "user123" }, default), Times.Once);
    }

    [Fact]
    public async Task GetGlobalChatHistory_ShouldReturnHistoryFromService()
    {
        // Arrange
        var history = new List<ChatMessageDto> { new ChatMessageDto { Id = 1, Message = "test" } };
        _mockSocialService.Setup(s => s.GetGlobalChatHistory(50)).ReturnsAsync(history);

        // Act
        var result = await _sut.GetGlobalChatHistory();

        // Assert
        result.Should().BeEquivalentTo(history);
    }

    [Fact]
    public async Task GetFriends_ShouldReturnFriendsFromService()
    {
        // Arrange
        var friends = new List<UserDto> { new UserDto { Id = "u1", UserName = "User1" } };
        _mockSocialService.Setup(s => s.GetFriends("user123")).ReturnsAsync(friends);

        // Act
        var result = await _sut.GetFriends();

        // Assert
        result.Should().BeEquivalentTo(friends);
    }

    [Fact]
    public async Task GetFriendRequests_ShouldReturnRequestsFromService()
    {
        // Arrange
        var requests = new List<FriendRequestDto> { new FriendRequestDto { Id = 1, RequesterId = "r1" } };
        _mockSocialService.Setup(s => s.GetFriendRequests("user123")).ReturnsAsync(requests);

        // Act
        var result = await _sut.GetFriendRequests();

        // Assert
        result.Should().BeEquivalentTo(requests);
    }
}
