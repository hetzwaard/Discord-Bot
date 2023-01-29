const { ButtonInteraction, Client, AttachmentBuilder, EmbedBuilder, ChannelType, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js')

const ticketSystemDB = require('../../../models/TicketSystem')
const ticketDB = require('../../../models/Ticket')

module.exports = {
    data: {
        name: "ticket-open"
    },
    /**
     * 
     * @param {ButtonInteraction} interaction 
     * @param {Client} client 
     */
    async execute(interaction, client) {
        const { guildId, message, member, guild } = interaction;

        ticketSystemDB.findOne({GuildID: guildId}, async (err, systemData) => {
            if(err) throw err;
            if(!systemData) return;

            ticketDB.findOne({ GuildID: guild.id, MemberID: member.id }, (err, data) => {
                if(err) throw err;
                if(data) return interaction.reply({ content: `❌ You already have an open ticket <#${data.ChannelID}>`, ephemeral: true});

                const random = Math.floor(Math.random() * 9999) + 1000;

                const category = guild.channels.cache.get(systemData.CategoryID);
                guild.channels.create({
                    name: `ticket-${random}`,
                    parent: category,
                    type: ChannelType.GuildText,
                    permissionOverwrites: []
                }).then(async (channel) => {
                    channel.permissionOverwrites.edit(member.id, { ViewChannel: true });
                    channel.permissionOverwrites.edit(guild.roles.everyone.id, { ViewChannel: false });
    
                    const close_ticket = new ButtonBuilder()
                    .setCustomId('ticket-close')
                    .setLabel('🚪 Close')
                    .setStyle(ButtonStyle.Danger)

                    const lock_ticket = new ButtonBuilder()
                    .setCustomId('ticket-lock')
                    .setLabel('🔒 Lock')
                    .setStyle(ButtonStyle.Secondary)

                    const unlock_ticket = new ButtonBuilder()
                    .setCustomId('ticket-unlock')
                    .setLabel('🔓 Unlock')
                    .setStyle(ButtonStyle.Secondary)

                    const message = systemData.RoleIDs.map(r => `<@&${r}>`).join(" ")
                   
                    
                    await channel.send({
                        content: `${systemData.RoleIDs ? message : ''}`,
                        embeds: [
                            new EmbedBuilder()
                            .setTitle('✉️ Ticket System')
                            .setDescription('Please wait for a staff to answer your ticket!')
                            .setColor(client.color)
                            .setTimestamp(Date.now())
                        ],
                        components: [
                            new ActionRowBuilder()
                            .addComponents(close_ticket, lock_ticket, unlock_ticket)
                        ]
                    })

                    ticketDB.create(
                        { 
                            GuildID: guild.id,
                            ChannelID: channel.id,
                            MemberID: member.id,
                            Locked: false,
                            TicketID: random,
                            CreatedAt: channel.createdTimestamp                   
                        })

                    return interaction.reply({ content: `Ticket created <#${channel.id}>`, ephemeral: true })
                })
            })
        })
    }
}