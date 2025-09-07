import { Client, Collection } from "discord.js";
import BaseCommand from "./base_command";

//MyClient is a Discordjs client with slashcommands and player paramaters
export default interface MyClient extends Client {
    commands: Collection<string, BaseCommand>;
}
