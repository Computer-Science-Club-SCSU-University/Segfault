import { Interaction, Events } from "discord.js";
import MyClient from "../client";
import BaseEvent from "../base_event";

const interactionCreateEvent: BaseEvent = {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction): Promise<void> {
        const client = interaction.client as MyClient;

        if (interaction.isChatInputCommand()) {
            console.log(
                `Slash command: ${interaction.commandName} | ${interaction.guild?.name || 'DM'}`
            );

            const command = client.commands.get(interaction.commandName);
            if (!command) {
                await interaction.reply({
                    content: "Command not found!",
                    ephemeral: true
                });
                return;
            }

            try {
                await command.run(interaction);
            } catch (error) {
                console.error(`Error executing command ${interaction.commandName}:`, error);

                const errorMessage = {
                    content: "There was an error executing this command!",
                    ephemeral: true
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
        }
    },
};

export default interactionCreateEvent;
