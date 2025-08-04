const { SlashCommandBuilder } = require('@discordjs/builders');
const catCommand = require('../../../src/commands/entertainment/cat');
const { CommandInteraction } = require('discord.js');
const fetch = require('node-fetch');

describe('cat command', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('should be a slash command', () => {
    expect(catCommand.data).toBeInstanceOf(SlashCommandBuilder);
  });

  it('should have a cooldown', () => {
    expect(catCommand.cooldown).toBe(5);
  });

  it('should fetch a cat picture and reply with an embed', async () => {
    const mockCat = { url: 'https://cdn2.thecatapi.com/images/123.jpg' };
    fetch.mockResponseOnce(JSON.stringify([mockCat]));

    const interaction = {
      reply: jest.fn(),
    };

    await catCommand.execute(interaction);

    expect(fetch).toHaveBeenCalledWith('https://api.thecatapi.com/v1/images/search');
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
      embeds: [expect.any(Object)],
    }));
  });

  it('should handle fetch errors gracefully', async () => {
    fetch.mockReject(new Error('API is down'));

    const interaction = {
      reply: jest.fn(),
    };

    await catCommand.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith({
      content: 'Failed to fetch a cat picture. Please try again later.',
      ephemeral: true,
    });
  });

  it('should handle non-ok responses from fetch', async () => {
    fetch.mockResponseOnce(JSON.stringify([]), { status: 500 });

    const interaction = {
      reply: jest.fn(),
    };

    await catCommand.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith({
      content: 'Failed to fetch a cat picture. Please try again later.',
      ephemeral: true,
    });
  });
});
