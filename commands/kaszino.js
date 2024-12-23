const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Store each player's game and credit state
const games = new Map();
const credits = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('Play a game of Blackjack with betting!'),

    // Command to start betting and initialize the game
    async execute(interaction) {
        const userId = interaction.user.id;

        // Initialize credits if the user doesn't have any
        if (!credits.has(userId)) {
            credits.set(userId, 100); // Start with 100 credits
        }

        // Reset game state
        games.set(userId, { hand: [], dealerHand: [], bet: 10, gameOver: false, inBettingPhase: true });

        // Create and send the betting phase embed
        const betEmbed = createBetEmbed(interaction.user);
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('increase_bet').setLabel('Increase Bet').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('decrease_bet').setLabel('Decrease Bet').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('start_game').setLabel('Start Game').setStyle(ButtonStyle.Success)
            );

        await interaction.reply({ embeds: [betEmbed], components: [row] });
    },

    // Handle button interactions for betting and gameplay
    async handleButton(interaction) {
        const userId = interaction.user.id;
        const game = games.get(userId);
        const userCredits = credits.get(userId);

        if (!game) {
            return interaction.reply({ content: "No game found. Start a new game with /blackjack", ephemeral: true });
        }

        // Handle betting phase buttons
        if (game.inBettingPhase) {
            if (interaction.customId === 'increase_bet') {
                game.bet = Math.min(game.bet + 10, userCredits); // Increase bet, maxing at current credits
            } else if (interaction.customId === 'decrease_bet') {
                game.bet = Math.max(game.bet - 10, 10); // Decrease bet, with a minimum of 10
            } else if (interaction.customId === 'start_game') {
                if (userCredits < game.bet) {
                    return interaction.reply({ content: "Insufficient credits to place this bet!", ephemeral: true });
                }
                // Deduct bet and start the game
                credits.set(userId, userCredits - game.bet);
                game.inBettingPhase = false;
                game.hand = [drawCard(), drawCard()];
                game.dealerHand = [drawCard()];
                game.gameOver = false;

                // Start the game embed
                const gameEmbed = createGameEmbed(game, interaction.user);
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId('hit').setLabel('Hit').setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId('stand').setLabel('Stand').setStyle(ButtonStyle.Danger)
                    );
                return interaction.update({ embeds: [gameEmbed], components: [row] });
            }

            // Update betting embed if in betting phase
            const betEmbed = createBetEmbed(interaction.user, game.bet);
            return interaction.update({ embeds: [betEmbed] });
        }

        // Handle game phase buttons for Hit/Stand
        if (interaction.customId === 'hit') {
            game.hand.push(drawCard());

            if (calculateScore(game.hand) > 21) {
                game.gameOver = true;
                const resultEmbed = createGameEmbed(game, interaction.user, 'You busted!');
                return interaction.update({ embeds: [resultEmbed], components: [] });
            }
        } else if (interaction.customId === 'stand') {
            while (calculateScore(game.dealerHand) < 17) {
                game.dealerHand.push(drawCard());
            }

            game.gameOver = true;
            const resultMessage = determineWinner(game);
            const resultEmbed = createGameEmbed(game, interaction.user, resultMessage);

            // Adjust credits based on the game result
            if (resultMessage.includes('You win')) {
                credits.set(userId, credits.get(userId) + game.bet * 2);
            }
            return interaction.update({ embeds: [resultEmbed], components: [] });
        }

        // Update the game embed after player's action
        const gameEmbed = createGameEmbed(game, interaction.user);
        await interaction.update({ embeds: [gameEmbed] });
    },
};

// Helper Functions
function drawCard() {
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const suits = ['♠', '♥', '♦', '♣'];
    const value = values[Math.floor(Math.random() * values.length)];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    return `${value}${suit}`;
}

function calculateScore(hand) {
    if (!Array.isArray(hand)) return 0;
    let score = 0;
    let aces = 0;
    hand.forEach(card => {
        const value = card.slice(0, -1);
        if (value === 'A') {
            aces += 1;
            score += 11;
        } else if (['K', 'Q', 'J'].includes(value)) {
            score += 10;
        } else {
            score += parseInt(value);
        }
    });
    while (score > 21 && aces) {
        score -= 10;
        aces -= 1;
    }
    return score;
}

function createBetEmbed(user, currentBet = 10) {
    const userCredits = credits.get(user.id) || 0;
    return new EmbedBuilder()
        .setTitle(`${user.username}'s Blackjack Betting Phase`)
        .setDescription('Place your bet before starting the game!')
        .addFields(
            { name: 'Current Bet', value: `${currentBet} credits`, inline: true },
            { name: 'Available Credits', value: `${userCredits} credits`, inline: true }
        )
        .setFooter({ text: 'Use the buttons below to adjust your bet, then click Start Game.' });
}

function createGameEmbed(game, user, result = '') {
    const userHand = game.hand.join(', ') || 'No cards';
    const dealerHand = game.dealerHand.join(', ') || 'No cards';
    const userCredits = credits.get(user.id) || 0;

    return new EmbedBuilder()
        .setTitle(`${user.username}'s Blackjack Game`)
        .addFields(
            { name: 'Your Hand', value: `${userHand} (Score: ${calculateScore(game.hand)})`, inline: true },
            { name: 'Dealer\'s Hand', value: `${dealerHand} (Score: ${calculateScore(game.dealerHand)})`, inline: true },
            { name: 'Your Credits', value: `${userCredits} credits`, inline: true }
        )
        .setFooter({ text: result || 'Choose Hit or Stand' });
}

function determineWinner(game) {
    const playerScore = calculateScore(game.hand);
    const dealerScore = calculateScore(game.dealerHand);

    if (playerScore > 21) return 'You busted! Dealer wins!';
    if (dealerScore > 21) return 'Dealer busted! You win!';
    if (playerScore === dealerScore) return 'It\'s a tie!';
    return playerScore > dealerScore ? 'You win!' : 'Dealer wins!';
}
