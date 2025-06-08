// commands/utility/gamble.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { readUser, writeUser, appendUserLog } = require('../../../utils/jsondb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gamble')
    .setDescription('Gamble your coins for a chance to win big!')
    .addIntegerOption(option =>
      option.setName('amount').setDescription('Amount to gamble').setRequired(true)),
  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    if (amount <= 0) return interaction.reply({ content: 'Enter a valid amount.', flags: 64 });
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const profile = await readUser('profiles', userId, guildId);
    const money = profile.money || 0;
    if (money < amount) return interaction.reply({ content: 'Not enough coins.', flags: 64 });
    // --- Blackjack game logic ---
    const suits = [':hearts:', ':diamonds:', ':clubs:', ':spades:'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    function drawCard() {
      const suit = suits[Math.floor(Math.random() * suits.length)];
      const value = values[Math.floor(Math.random() * values.length)];
      return { suit, value };
    }
    function handValue(hand) {
      let val = 0, aces = 0;
      for (const card of hand) {
        if (card.value === 'A') { val += 11; aces++; }
        else if (['K','Q','J'].includes(card.value)) val += 10;
        else val += parseInt(card.value);
      }
      while (val > 21 && aces > 0) { val -= 10; aces--; }
      return val;
    }
    function handToString(hand) {
      return hand.map(card => `${card.suit}${card.value}`).join(' ');
    }
    // Initial hands
    let playerHand = [drawCard(), drawCard()];
    let dealerHand = [drawCard(), drawCard()];
    let gameOver = false;
    let resultMsg = '';
    // Initial embed
    const embed = new EmbedBuilder()
      .setTitle('🎲 Gamble')
      .setDescription('Try your luck in blackjack!')
      .setColor('Blurple')
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/616/616554.png')
      .setFooter({ text: 'Blackjack powered by Nyx!' })
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
    // Blackjack game embed
    embed = new EmbedBuilder()
      .setTitle('🃏 Blackjack')
      .setDescription(`Bet: **${amount}** coins\n\n**Your Hand:** ${handToString(playerHand)} (**${handValue(playerHand)}**)\n**Dealer:** ${dealerHand[0].suit}${dealerHand[0].value} :grey_question:`)
      .setColor('Blurple');
    let row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('hit').setLabel('Hit').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('stand').setLabel('Stand').setStyle(ButtonStyle.Primary)
    );
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    const msg = await interaction.fetchReply();
    const filter = i => ['hit','stand'].includes(i.customId) && i.user.id === interaction.user.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 60000 });
    async function finishGame(win, blackjack = false) {
      gameOver = true;
      let profile = await readUser('profiles', interaction.user.id, interaction.guild.id);
      let result;
      if (win === 'win') {
        profile.money = (profile.money || 0) + amount;
        result = `🎉 You win! You gain **${amount}** coins!`;
      } else if (win === 'blackjack') {
        profile.money = (profile.money || 0) + Math.floor(amount * 1.5);
        result = `🃏 Blackjack! You win **${Math.floor(amount * 1.5)}** coins!`;
      } else {
        profile.money = (profile.money || 0) - amount;
        result = `😢 You lose **${amount}** coins.`;
      }
      await writeUser('profiles', interaction.user.id, interaction.guild.id, profile);
      await appendUserLog('logs', interaction.user.id, interaction.guild.id, {
        event_type: 'GAMBLE',
        reason: win === 'win' ? `Blackjack win ${amount}` : `Blackjack loss ${amount}`,
        warned_by: interaction.user.id,
        channel_id: interaction.channel.id,
        message_id: interaction.id,
        message_content: null,
        date: Date.now()
      }, interaction.user.username);
      let dealerStr = handToString(dealerHand) + ` (**${handValue(dealerHand)}**)`;
      let playerStr = handToString(playerHand) + ` (**${handValue(playerHand)}**)`;
      let endEmbed = new EmbedBuilder()
        .setTitle('🃏 Blackjack Result')
        .setDescription(`**Your Hand:** ${playerStr}\n**Dealer:** ${dealerStr}\n\n${result}`)
        .setColor(win === 'lose' ? 'Red' : 'Green');
      await interaction.editReply({ embeds: [endEmbed], components: [] });
    }
    // Check for initial blackjack
    if (handValue(playerHand) === 21) {
      await finishGame('blackjack', true);
      return;
    }
    collector.on('collect', async i => {
      if (gameOver) return;
      if (i.customId === 'hit') {
        playerHand.push(drawCard());
        if (handValue(playerHand) > 21) {
          await i.deferUpdate();
          await finishGame('lose');
          return;
        }
        embed = new EmbedBuilder()
          .setTitle('🃏 Blackjack')
          .setDescription(`Bet: **${amount}** coins\n\n**Your Hand:** ${handToString(playerHand)} (**${handValue(playerHand)}**)\n**Dealer:** ${dealerHand[0].suit}${dealerHand[0].value} :grey_question:`)
          .setColor('Blurple');
        await i.update({ embeds: [embed], components: [row] });
      } else if (i.customId === 'stand') {
        await i.deferUpdate();
        // Dealer's turn
        while (handValue(dealerHand) < 17) dealerHand.push(drawCard());
        let playerVal = handValue(playerHand);
        let dealerVal = handValue(dealerHand);
        if (dealerVal > 21 || playerVal > dealerVal) {
          await finishGame('win');
        } else if (dealerVal === playerVal) {
          // Push: refund bet
          let profile = await readUser('profiles', interaction.user.id, interaction.guild.id);
          await interaction.editReply({ embeds: [new EmbedBuilder()
            .setTitle('🃏 Blackjack Result')
            .setDescription(`**Your Hand:** ${handToString(playerHand)} (**${playerVal}**)\n**Dealer:** ${handToString(dealerHand)} (**${dealerVal}**)\n\nIt's a push! Your bet is refunded.`)
            .setColor('Yellow')], components: [] });
        } else {
          await finishGame('lose');
        }
      }
    });
  },
};
