const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton, MessageAttachment,MessageSelectMenu } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const archiver = require('archiver');

// Register the custom font
registerFont('trenda-bold.otf', { family: 'Trenda Bold' });

async function splitImageAndCreateZIP(imageBuffer, numSplits) {
    // Load the image
    const image = await loadImage(imageBuffer);

    // Create a canvas
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, image.width, image.height);

    // Create a folder for the splitted images
    const folderPath = 'Emojis/';
    fs.mkdirSync(folderPath, { recursive: true });

    // Split the image into pieces
    const pieceWidth = image.width / numSplits;
    const pieceHeight = image.height;

    // Create an array to hold the buffers of splitted images
    const buffers = [];

    for (let i = 0; i < numSplits; i++) {
        // Create a canvas for each piece
        const pieceCanvas = createCanvas(pieceWidth, pieceHeight);
        const pieceCtx = pieceCanvas.getContext('2d');

        // Draw the piece onto the canvas
        pieceCtx.drawImage(canvas, i * pieceWidth, 0, pieceWidth, pieceHeight, 0, 0, pieceWidth, pieceHeight);

        // Convert canvas to a buffer
        const buffer = pieceCanvas.toBuffer('image/png');

        // Save the piece image to a file
        const filePath = `${folderPath}piece_${i}.png`;
        fs.writeFileSync(filePath, buffer);

        // Add the buffer to the array
        buffers.push({ buffer, filePath });
    }

    // Return the array of buffers and the folder path
    return { buffers, folderPath };
}function writeNameOnTemplate(name, templateName) {
    return new Promise((resolve, reject) => {
        loadImage(templateName).then((templateImage) => {
            // Create canvas with the same dimensions as the template image
            const canvas = createCanvas(templateImage.width, templateImage.height);
            const ctx = canvas.getContext('2d');

            // Draw the template image onto the canvas
            ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);

            // Position the text in the center of the canvas
            ctx.font = '35px "Trenda Bold"'; // Using the registered font
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Calculate the starting coordinate for the text
            const startX = canvas.width / 2;
            const startY = canvas.height / 2;

            // Draw the name on the template image
            ctx.fillText(name, startX, startY);

            // Save the canvas to a buffer
            const buffer = canvas.toBuffer('image/png');

            // Resolve with the buffer
            resolve(buffer);
        }).catch((err) => {
            reject('Error loading template image:', err);
        });
    });
}

// Function to update template image color
function updateTemplateImageColor(imageBuffer, color) {
    return new Promise((resolve, reject) => {
        loadImage(imageBuffer).then((image) => {
            const canvas = createCanvas(image.width, image.height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

            // Update the color, excluding #FFFFFF
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;
            for (let i = 0; i < pixels.length; i += 4) {
                const red = pixels[i];
                const green = pixels[i + 1];
                const blue = pixels[i + 2];
                const alpha = pixels[i + 3];

                // Check if the pixel color is not #FFFFFF
                if (!(red === 255 && green === 255 && blue === 255)) {
                    // Update the pixel color
                    pixels[i] = parseInt(color.substring(1, 3), 16);
                    pixels[i + 1] = parseInt(color.substring(3, 5), 16);
                    pixels[i + 2] = parseInt(color.substring(5, 7), 16);
                }
            }
            ctx.putImageData(imageData, 0, 0);

            // Convert canvas to buffer
            const updatedBuffer = canvas.toBuffer('image/png');
            resolve(updatedBuffer);
        }).catch((err) => {
            reject('Error updating template image color:', err);
        });
    });
}

// Discord Bot
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });


client.once('ready', () => {
    console.log(`Bot Started With Name ${client.user.tag}.`);
    const activityType = 'STREAMING';
    client.user.setPresence({
        activities: [{ name: "By Brimo", type: activityType }],
        status: 'idle'
    });
    console.log(`Done Set Activity`);
});

client.on('channelCreate', async (channel) => {
    if (channel.type === 'GUILD_TEXT' && channel.parentId === '1231398073855643679') {
        let nameButtonClicked = false;
        let colorChosen = false;

        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('شـراء بنر لبروفايلك')
            .setImage('https://media.discordapp.net/attachments/1012074200271433799/1231391629638897737/output.png?ex=6636c9d2&is=662454d2&hm=59d48896b05f3256d7c21b5869230b8d3bf0fc3089753ca54ccf930469ad2e5d&=&format=webp&quality=lossless')
            .setDescription('إضغط على الزر الأخضر من أجل الإستمرار');

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('choose_name')
                    .setLabel('إختار إسم')
                    .setStyle('SUCCESS'),
            );

        const response = await channel.send({ embeds: [embed], components: [row] });

        const collector = response.createMessageComponentCollector({ time: 3600000 });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'choose_name') {
                if (!nameButtonClicked) {
                    nameButtonClicked = true;
                    await interaction.reply({ content: '** الرجاء قم بكتابة الإسم الذي تريده (لا نتحمل مسؤولية إخطائك في كتابة الإسم ⚠️ ):**', ephemeral: true });

                    const nameCollector = interaction.channel.createMessageCollector({ time: 3600000 });


                    nameCollector.on('collect', async (msg) => {
                        nameCollector.stop();
                        const name = msg.content.trim();
                        try {
                            let templateName;
                            let numSplits; // Define numSplits here
                            if (name.length <= 4) {
                                templateName = 'TEMPLATES 1/-4.png';
                                numSplits = 6;
                            } else if (name.length === 5) {
                                templateName = 'TEMPLATES 1/5.png';
                                numSplits = 6;
                            } else if (name.length === 6) {
                                templateName = 'TEMPLATES 1/6.png';
                                numSplits = 7;
                            } else if (name.length === 7 || name.length === 8) {
                                templateName = 'TEMPLATES 1/7.png';
                                numSplits = 7;
                            } else if (name.length === 8) {
                                templateName = 'TEMPLATES 1/8.png';
                                numSplits = 8;
                            } else if (name.length === 9) {
                                templateName = 'TEMPLATES 1/8.png';
                                numSplits = 8;
                            } else if (name.length === 10) {
                                templateName = 'TEMPLATES 1/9.png';
                                numSplits = 8;
                            } else if (name.length === 11) {
                                templateName = 'TEMPLATES 1/10.png';
                                numSplits = 9;
                            } else {
                                await interaction.followUp({ content: 'Name is too long', ephemeral: true });
                                return;
                            }

                            const imageBuffer = await writeNameOnTemplate(name, templateName);

                            // Prompt user to choose a color
                            const colorEmbed = new MessageEmbed()
                                .setColor('#0099ff')
                                .setTitle('إختيار اللون')
                                .setDescription('الرجاء قم بإختيار اللون الذي تريده على البنر:')
                                .addFields(
                                    { name: 'Red', value: '🔴', inline: true },
                                    { name: 'Green', value: '🟢', inline: true },
                                    { name: 'Blue', value: '🔵', inline: true },
                                    { name: 'Yellow', value: '🟡', inline: true },
                                    { name: 'Purple', value: '🟣', inline: true },
                                    { name: 'Orange', value: '🟠', inline: true },
                                    { name: 'Pink', value: '🌸', inline: true },
                                    { name: 'Cyan', value: '🔷', inline: true },
                                );


                            const colorRow1 = new MessageActionRow()
                                .addComponents(
                                    new MessageButton()
                                        .setCustomId('choose_color_red')
                                        .setLabel('Red')
                                        .setEmoji('🔴')
                                        .setStyle('PRIMARY'),
                                    new MessageButton()
                                        .setCustomId('choose_color_green')
                                        .setLabel('Green')
                                        .setEmoji('🟢')
                                        .setStyle('PRIMARY'),
                                    new MessageButton()
                                        .setCustomId('choose_color_blue')
                                        .setLabel('Blue')
                                        .setEmoji('🔵')
                                        .setStyle('PRIMARY'),
                                    new MessageButton()
                                        .setCustomId('choose_color_yellow')
                                        .setLabel('Yellow')
                                        .setEmoji('🟡')
                                        .setStyle('PRIMARY'),
                                    new MessageButton()
                                        .setCustomId('choose_color_purple')
                                        .setLabel('Purple')
                                        .setEmoji('🟣')
                                        .setStyle('PRIMARY')
                                );

                            const colorRow2 = new MessageActionRow()
                                .addComponents(
                                    new MessageButton()
                                        .setCustomId('choose_color_orange')
                                        .setLabel('Orange')
                                        .setEmoji('🟠')
                                        .setStyle('PRIMARY'),
                                    new MessageButton()
                                        .setCustomId('choose_color_pink')
                                        .setLabel('Pink')
                                        .setEmoji('🌸')
                                        .setStyle('PRIMARY'),
                                    new MessageButton()
                                        .setCustomId('choose_color_cyan')
                                        .setLabel('Cyan')
                                        .setEmoji('🔷')
                                        .setStyle('PRIMARY')
                                );

                            await interaction.followUp({ embeds: [colorEmbed], components: [colorRow1, colorRow2] });

                          const colorFilter = (colorInteraction) =>
                                ['choose_color_red', 'choose_color_green', 'choose_color_blue', 'choose_color_yellow', 'choose_color_purple', 'choose_color_orange', 'choose_color_pink', 'choose_color_cyan'].includes(colorInteraction.customId);

                            const colorCollector = channel.createMessageComponentCollector({ filter: colorFilter, time: 3600000 });

                            colorCollector.on('collect', async (colorInteraction) => {
                                if (!colorChosen) {
                                    colorChosen = true;
                                    let color;
                                    switch (colorInteraction.customId) {
                                        case 'choose_color_red':
                                            color = '#FF0000';
                                            break;
                                        case 'choose_color_green':
                                            color = '#23ad00';
                                            break;
                                        case 'choose_color_blue':
                                            color = '#356bff';
                                            break;
                                        case 'choose_color_yellow':
                                            color = '#ffa000';
                                            break;
                                        case 'choose_color_purple':
                                            color = '#7c30ff';
                                            break;
                                        case 'choose_color_orange':
                                            color = '#ff4600';
                                            break;
                                        case 'choose_color_pink':
                                            color = '#b700ff';
                                            break;
                                        case 'choose_color_cyan':
                                            color = '#00f1ff';
                                            break;
                                        default:
                                            color = '#FF0000'; // Default to red
                                            break;
                                    }
                                    await colorInteraction.reply({ content: `**تم إختيار اللون "${colorInteraction.customId.split('_').join(' ')}" بنجاح ✅!**`, ephemeral: true });

                                    // Update the template image with the selected color
                                    const updatedImageBuffer = await updateTemplateImageColor(imageBuffer, color);
                                    // Continue with payment confirmation logic
                                    const price = "15000";
                                    const resulting = Math.floor(price * (20) / (19) + (1));
                                    const transferto = "766349119077220353";
                                    const probotid = "282859044593598464";
                                    const transferMessage = `\`\`\`#credit ${transferto} ${resulting}\`\`\``;

                                    await interaction.followUp({ content: transferMessage, ephemeral: true });

                                    console.log('Waiting for payment confirmation...');

                                    const filter = (response) =>
                                        response.author.id === probotid &&
                                        response.content.includes(
                                            `:moneybag: | ${interaction.user.username}, has transferred \`$${price}\` to <@!${transferto}> **`
                                        );

                                    const paymentCollector = interaction.channel.createMessageCollector({ filter, max: 1, time: 3600000 });
                                    paymentCollector.on('collect', async () => {
                                        console.log('Payment confirmation received.');

                                        // Split the image and get the array of buffers and folder path
                                        const { buffers, folderPath } = await splitImageAndCreateZIP(updatedImageBuffer, numSplits);

                                        // Send the full image as a message
                                        const fullImageAttachment = new MessageAttachment(updatedImageBuffer, 'full_image.png');
                                        await channel.send({ files: [fullImageAttachment] });

                                        // Create a ZIP file
                                        const output = fs.createWriteStream('splitted_image.zip');
                                        const archive = archiver('zip', {
                                            zlib: { level: 9 } // Set compression level
                                        });

                                        archive.on('error', (err) => {
                                            throw err;
                                        });

                                        archive.pipe(output);

                                        // Add the splitted images to the ZIP file
                                        for (let i = 0; i < buffers.length; i++) {
                                            const { buffer, filePath } = buffers[i];
                                            archive.append(buffer, { name: filePath });
                                        }

                                        // Finalize the ZIP file
                                        archive.finalize();

                                        // Send the ZIP file as an attachment
                                        output.on('close', async () => {
                                            const zipAttachment = new MessageAttachment('splitted_image.zip');
                                            await channel.send({ files: [zipAttachment] });
                                        });

                                        const messageContent = '**✅ تم الإنتهاء من صناعة البنر بنجاح**';
                                        if (messageContent) {
                                            await interaction.followUp({ content: messageContent, ephemeral: true });
                                            setTimeout(() => {
                                                interaction.channel.delete();
                                            }, 600000);
                                        } else {
                                            console.error('Invalid message content');
                                        }
                                    });

                                    paymentCollector.on('end', (collected, reason) => {
                                        if (reason === 'time') {
                                            interaction.followUp({ content: 'Payment confirmation timed out. Please try again.', ephemeral: true });
                                        }
                                    });
                                } else {
                                    await colorInteraction.reply({ content: 'لقد اخترت لونا بالفعل.', ephemeral: true });
                                }
                            });

                            colorCollector.on('end', (collected, reason) => {
                                if (reason === 'time') {
                                    console.log('timeout')
                                }
                            });
                        } catch (error) {
                            await interaction.followUp({ content: error.message, ephemeral: true });
                        }
                    });

                    nameCollector.on('end', (collected, reason) => {
                        if (reason === 'time') {
                            console.log('timeout')
                        }
                    });
                } else {
                    await interaction.reply({ content: 'لقد إخترت اسما بالفعل', ephemeral: true });
                }
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                response.edit({ components: [] });
            }
        });
    }
});

client.login("");


//////////////////
//////////////////
//////////////////
//////////////////
//////////////////
//////////////////
//////////////////
//////////////////
//////////////////
//////////////////
//////////////////
//////////////////
//////////////////
//////////////////
//////////////////
//////////////////
//////////////////
//////////////////
//////////////////
//////////////////
//////////////////
//////////////////
//////////////////
//////////////////
//////////////////
//////////////////
//////////////////
//////////////////
//////////////////
const GUILD_ID = "1213779543538532392";


let ticketCounter = { count: 0 };

function initializeTicketCounter() {
    try {
        const rawData = fs.readFileSync('tickets.json');
        const savedData = JSON.parse(rawData);
        ticketCounter = savedData.ticketCounter || { count: 0 };
    } catch (error) {
        console.error('Error reading tickets.json:', error);
        ticketCounter = { count: 0 }; // Initialize to 0 if file doesn't exist or is corrupted
    }
}

function saveTicketCounter() {
    fs.writeFile('tickets.json', JSON.stringify({ ticketCounter }, null, 2), (err) => {
        if (err) console.error('Error saving ticket counter:', err);
    });
}

// Load ticket counter data when the bot starts
initializeTicketCounter();

// Increment ticket counter
function incrementTicketCounter() {
    ticketCounter.count++;
    saveTicketCounter();
}

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand() && !interaction.isSelectMenu()) return;

    if (interaction.isCommand()) {
        const { commandName, options, guild } = interaction;

        if (commandName === 'ticketsetup') {
            if (interaction.user.id !== '766349119077220353') { 
                return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
            }

            const panelChannel = options.getChannel('panel_channel');
            const categoryChannel = options.getChannel('category');

            if (!panelChannel || !categoryChannel || categoryChannel.type !== 'GUILD_CATEGORY') {
                return interaction.reply({ content: 'Please provide both a panel channel and a valid category.', ephemeral: true });
            }

            const settings = {
                panelChannelId: panelChannel.id,
                categoryId: categoryChannel.id
            };

            fs.writeFile('ticketsettings.json', JSON.stringify(settings, null, 2), (err) => {
                if (err) throw err;
                console.log('Settings saved in ticketsettings.json');
                interaction.reply({ content: 'Settings saved successfully.', ephemeral: true });
            });
        } else if (commandName === 'send-ticket-panel') {
            if (interaction.user.id !== '766349119077220353') { 
                return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
            }

            try {
                const rawData = fs.readFileSync('ticketsettings.json');
                const settings = JSON.parse(rawData);

                const panelChannelId = settings.panelChannelId;

                if (!panelChannelId) {
                    return interaction.reply({ content: 'Panel channel is not set. Please use /ticketsetup command to set it.', ephemeral: true });
                }

                const row = new MessageActionRow()
                    .addComponents(
                        new MessageSelectMenu()
                            .setCustomId('ticket-menu')
                            .setPlaceholder('Select an option')
                            .addOptions([
                                {
                                    label: 'Open Ticket',
                                    value: 'open_ticket'
                                },
                                {
                                    label: 'Reset Menu',
                                    value: 'reset_menu'
                                }
                            ])
                    );

                const embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('تذكرة شراء')
                    .setDescription('تذكرة شراء بانر بإسمك للبروفايل حقك')
                    .setImage('https://cdn.discordapp.com/attachments/1012074200271433799/1231402664277835786/Untitled.png?ex=6625b099&is=66245f19&hm=70a6f1644292692b38124f28efbd8c3ffb5fe4b2d6e4c1d7f49dca402f30a4b2&')
                    .setTimestamp();


                const channel = await client.channels.fetch(panelChannelId);
                if (channel && channel.isText()) {
                    await channel.send({ embeds: [embed], components: [row] });
                    interaction.reply({ content: 'Ticket panel sent successfully.', ephemeral: true });
                } else {
                    interaction.reply({ content: 'Panel channel not found or not a text channel.', ephemeral: true });
                }
            } catch (err) {
                console.error('Error:', err);
                interaction.reply({ content: 'An error occurred while sending the ticket panel.', ephemeral: true });
            }
        }
    } else if (interaction.isSelectMenu()) {
        const { customId, values } = interaction;

        if (customId === 'ticket-menu') {
            if (values[0] === 'open_ticket') {
                try {
                    const rawData = fs.readFileSync('ticketsettings.json');
                    const settings = JSON.parse(rawData);

                    const categoryId = settings.categoryId;

                    if (!categoryId) {
                        return interaction.reply({ content: 'Category is not set. Please use /ticketsetup command to set it.', ephemeral: true });
                    }

                    const guild = interaction.guild;
                    const category = guild.channels.cache.get(categoryId);
                    if (!category || category.type !== 'GUILD_CATEGORY') {
                        return interaction.reply({ content: 'Invalid category set in the settings.', ephemeral: true });
                    }

                    // Check if user has already created a ticket
                    if (ticketCounter[interaction.user.id]) {
                        return interaction.reply({ content: 'You have already created a ticket.', ephemeral: true });
                    }

                    // Increment ticket counter

                    const ticketNumber = String(ticketCounter.count).padStart(2, '0');

                    // Create ticket channel
                    const ticketChannel = await guild.channels.create(`ticket-${ticketNumber}`, {
                        type: 'GUILD_TEXT',
                        parent: categoryId,
                        permissionOverwrites: [
                            {
                                id: interaction.user.id,
                                allow: ['VIEW_CHANNEL']
                            },
                            {
                                id: guild.roles.everyone,
                                deny: ['VIEW_CHANNEL']
                            }
                        ]
                    });

                    // Restrict user from creating another ticket
                    ticketCounter[interaction.user.id] = ticketChannel.id;
                    incrementTicketCounter();
                                        
                    interaction.reply({ content: `Ticket channel <#${ticketChannel.id}> created successfully.`, ephemeral: true });
                } catch (err) {
                    console.error('Error:', err);
                    interaction.reply({ content: 'An error occurred while creating the ticket channel.', ephemeral: true });
                }
            } else if (values[0] === 'reset_menu') {
                try {
                    // Reset the selection menu here
                    interaction.values = ['Reset_Selected'];
                    await interaction.update().catch(async() => { return; });
                    await interaction.followUp({ content: 'Menu reset successfully.', ephemeral: true });
                } catch (error) {
                    console.error('Error while resetting selection menu:', error);
                    await interaction.followUp({ content: 'Failed to reset menu.', ephemeral: true });
                }
            }
        }
    }
});

client.on('channelDelete', async (channel) => {
    if (channel.type === 'GUILD_TEXT' && ticketCounter) {
        const userId = Object.keys(ticketCounter).find(key => ticketCounter[key] === channel.id);
        if (userId) {
            delete ticketCounter[userId];
            saveTicketCounter();
        }
    }
});

// Register slash commands
client.on('ready', async () => {
    const guild = await client.guilds.fetch(GUILD_ID);
    await guild.commands.set([
        {
            name: 'ticketsetup',
            description: 'ticketsetup the ticket system',
            options: [
                {
                    name: 'panel_channel',
                    description: 'The panel channel for the ticket system',
                    type: 'CHANNEL',
                    required: true
                },
                {
                    name: 'category',
                    description: 'The category for ticket channels',
                    type: 'CHANNEL',
                    required: true
                }
            ]
        },
        {
            name: 'send-ticket-panel',
            description: 'Send the ticket panel in the panel channel',
        }
    ]);

    console.log('Slash commands registered.');
});

