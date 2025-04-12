require('dotenv').config();
const { Client, GatewayIntentBits, Partials, ChannelType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { setDefaultHighWaterMark } = require('stream');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});


 ////////// APENAS SE EJECUTA //////////
client.once('ready', () => {
  console.log(`✅ Bot listo como ${client.user.tag}`);
  sendTicketMessage(); // Enviar mensaje estático con botón
});

                                //// APERTURA SISTEMA DE TICKETS ////
  // Mensaje estatico //
async function sendTicketMessage() {
  // ID del canal donde se enviara el mensaje estatico
  const supportChannelId = '1359948359359529083';
  // Canal donde se enviará el mensaje estático
  const channel = await client.channels.fetch(supportChannelId);

  // Crea el botón
  const ticketButton = new ButtonBuilder()
    .setCustomId('create_ticket')
    .setLabel('Abrir Ticket')
    .setStyle(ButtonStyle.Primary);

  // Enviar el mensaje con el botón
  const row = new ActionRowBuilder().addComponents(ticketButton);

  channel.send({
    content: '¡Hola! Si necesitas ayuda, puedes abrir un ticket haciendo clic en el botón de abajo.',
    components: [row]
  });
}

  // Apertura del ticket //
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  // Si el usuario presiona el botón de abrir ticket
  if (interaction.customId === 'create_ticket') {
    
        // Verificar si el usuario ya tiene un ticket abierto
        const existing = interaction.guild.channels.cache.find(c =>
          c.name === `ticket-${interaction.user.username.toLowerCase()}`
        );
    
        if (existing) {
          return interaction.reply({
            content: `❗ Ya tienes un ticket abierto: <#${existing.id}>`,
            flags: 64 // Flag para mensaje efimero
          });
        }
    
     ////////// Creacion del ticket //////////
    try {
      
      const ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: '1359948303974006906', // Reemplaza con el ID de tu categoría
        permissionOverwrites: [
          {
            id: interaction.guild.id, // Todos los miembros del servidor
            deny: [PermissionsBitField.Flags.ViewChannel], // No pueden ver el canal
          },
          {
            id: interaction.user.id, // El que creó el ticket
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages], // Solo él puede ver el canal
          },
          {
            id: '1359947447656255639', // Reemplaza con el ID del rol Staff
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages], // El rol Staff puede ver el canal
          },
          {
            id: client.user.id, // ID App
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels], // El bot puede ver el ticket
          }
        ],
      });

      // Botón para cerrar
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('🔒 Cerrar ticket')
          .setStyle(ButtonStyle.Danger)
      );

      // Enviar un mensaje de bienvenida al canal del ticket
      await ticketChannel.send({
        content: `🎟️ ¡Hola ${interaction.user.username}, tu ticket ha sido creado! Un miembro del staff te ayudará pronto.`,
        components: [row]
      });

      // Enviar un mensaje al canal original (donde presionaron el botón)
      await interaction.reply({
        content: `Tu ticket ha sido creado: <#${ticketChannel.id}>`,
        flags: 64 // Flag para mensaje efimero
      });

      // Eliminar el mensaje con el botón original después de que el ticket se haya creado
      // await interaction.message.delete();
    } catch (error) {
      console.error('Error al crear el ticket:', error);
      await interaction.reply({
        content: '❌ Ocurrió un error al crear el ticket. Intenta de nuevo más tarde.',
        flags: 64 // Flag para mensaje efimero
      });
    }
  }
});

  // Close tickets and Transcript //
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'close_ticket') {
    // Respuesta efímera
    await interaction.reply({
      content: '🔒 Cerrando ticket...',
      flags: 64  // Flag para mensaje efímero
    });

    const channel = interaction.channel;
    const messages = await channel.messages.fetch({ limit: 100 }); // Trae los últimos 100 mensajes
    const messagesContent = messages.map(m => `${m.author.tag}: ${m.content}`).join('\n');

    // Guardar como archivo de texto
    const filePath = path.join(__dirname, 'transcripts', `${channel.name}-transcript.txt`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true }); // Crear directorio si no existe

    // Comprobación para asegurarse que el archivo se está escribiendo correctamente
    try {
      fs.writeFileSync(filePath, messagesContent); // Escribir archivo
      console.log(`Archivo guardado en: ${filePath}`); // Log para confirmar la creación del archivo
    } catch (err) {
      console.error('Error al escribir el archivo de transcript:', err);
      return;
    }

    // Enviar archivo al canal de registro
    const registroChannel = interaction.guild.channels.cache.find(c => c.name === 'registro' && c.type === ChannelType.GuildText);
    if (registroChannel) {
      try {
        await registroChannel.send({
          content: `📜 Transcript del ticket <#${channel.name}>:`,
          files: [filePath]
        });
        console.log('Archivo enviado al canal de registro'); // Log de confirmación
      } catch (err) {
        console.error('Error al enviar el archivo al canal de registro:', err);
      }
    } else {
      console.error('No se encontró el canal de registro.');
    }

    // Eliminar el canal después de un breve retraso
    setTimeout(() => {
      channel.delete().catch(console.error);
    }, 5000);
  }
});
                                //// FINALIZACION SISTEMA DE TICKETS ////


                                //// APERTURA SISTEMA DE BIENVENIDAS ////
client.on('guildMemberAdd', async member => {
  const welcome_channel_id = '1360631057992388669'; // ID canal bienvenidas
  const channel = member.guild.channels.cache.get(welcome_channel_id);
  if (!channel) return;

  // Forzar actualizacion del contador de users
  const updateGuild = await member.guild.fetch();
  //crear embed
  const embed = new EmbedBuilder()
    .setColor('#00FFCC') // Color editable
    .setTitle(`¡Bienvenidx al sevidor!`)
    .setDescription(`Hola <@${member.id}>, estamos felices de tenerne en **${member.guild.name}**. \n¡Disfruta tu instacia aqui!`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true })) // Foto del user
    .setTimestamp()
    .setFooter({ text: `Miembro numero ${updateGuild.memberCount}`});

  // enviar el embed
  channel.send({embeds: [embed] }).catch(console.error);
});
                                //// FINALIZACION SISTEMA DE BIENVENIDAS ////


                                //// APERTURA SISTEMA DE SORTEOS ////
                                //// FINALIZACION SITEMA DE SORTEOS ////

                                //// COMANDOS CON PALABRAS CLAVE ////
client.on('messageCreate', async (message) => { // Comando !clean limpia el chat entero
  if (message.author.bot) return;
  if (message.content === '!clean') {
    // Verifica si tiene el rol Staff
    const staffRoleId = '1359947447656255639'; // ID del rol Staff
    if (!message.member.roles.cache.has(staffRoleId)) {
      return message.reply('❌ No tienes permisos para usar este comando.');
    }

    try {
      await message.channel.bulkDelete(100, true);
      await message.channel.send('🧹 Canal limpiado.');
    } catch (err) {
      console.error('Error al limpiar mensajes:', err);
      message.channel.send('❌ Hubo un error al intentar limpiar el canal.');
    }
  }
});

client.login(process.env.TOKEN);
