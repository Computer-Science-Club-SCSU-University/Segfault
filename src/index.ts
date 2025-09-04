import {
    Client,
    GatewayIntentBits,
    Collection,
    Options,
    GuildMember,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
    REST,
} from "discord.js";
import MyClient from "./client";

import BaseCommand from "./base_command";

import BaseEvent from "./base_event";

import fs from "fs";
import path from "path";

const ENVIORNMENT = process.env.NODE_ENV || "dev";

console.log(`Running in ${ENVIORNMENT} mode`);

//get env file based on enviornment
require("dotenv").config({
    path: path.join(__dirname, `..`, `.env.${ENVIORNMENT}`),
});

const CONFIG = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, `..`, `config.${ENVIORNMENT}.json`),
        "utf-8"
    )
);

//get env variables
const TOKEN = process.env.TOKEN || "";

//get config variables
const CLIENT_ID = CONFIG.CLIENT_ID || "";
const GUILD_ID = CONFIG.GUILD_ID || "";

async function main() {
    const LOAD_SLASH = process.argv[2] == "load";
    const GLOBAL = process.argv[3] == "global";

    const client = new Client({
        intents: [GatewayIntentBits.Guilds],
        //lower cache limit to hopefully decrease memory usage
        makeCache: Options.cacheWithLimits({
            ...Options.DefaultMakeCacheSettings,
            ReactionManager: 0,
            GuildMemberManager: {
                maxSize: 200, //default 200
                keepOverLimit: (member: GuildMember) =>
                    member.id === client.user?.id,
            },
        }),
        sweepers: Options.DefaultSweeperSettings,
    }) as MyClient;

    client.commands = new Collection<string, BaseCommand>();

    let commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];

    const slashDirectory = path.join(__dirname, "slash");
    const subDir = fs
        .readdirSync(slashDirectory)
        .filter((file: string) =>
            fs.statSync(path.join(slashDirectory, file)).isDirectory()
        );

    //register commands
    for (const dir of subDir) {
        const slashFiles = fs
            .readdirSync(path.join(slashDirectory, dir))
            .filter((file: string) => file.endsWith(".ts") || file.endsWith(`.js`));
        for (const file of slashFiles) {
            const commandClass = require(path.join(slashDirectory, dir, file))
                .default as typeof BaseCommand;
            const commandInstance = new commandClass();

            //if command does not have a data property, throw error
            if (!commandInstance.data) {
                console.error(`Command ${file} does not have a data property`);
                process.exit(1);
            }

            client.commands.set(commandInstance.data.name, commandInstance);
            if (LOAD_SLASH) {
                commands.push(commandInstance.data.toJSON());
            }
        }
    }

    if (LOAD_SLASH) {
        const rest = new REST({ version: "10" }).setToken(TOKEN);
        console.log("Deploying slash commands");
        const route = GLOBAL
            ? (`/applications/${CLIENT_ID}/commands` as `/${string}`)
            : (`/applications/${CLIENT_ID}/guilds/${GUILD_ID}/commands` as `/${string}`);

        try {
            await rest.put(route, { body: commands });
            console.log(
                `Successfully loaded commands ${GLOBAL ? "globally" : "locally"
                }`
            );
            process.exit(0);
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    } else {
        const clientPath = path.join(__dirname, "events");
        const eventFiles = fs
            .readdirSync(clientPath)
            .filter((file: string) => file.endsWith(".ts") || file.endsWith(`.js`));

        //register discord events
        for (const file of eventFiles) {
            const filePath = path.join(clientPath, file);
            const event = require(filePath).default as BaseEvent;
            try {
                if (event.once) {
                    client.once(event.name, (...args: unknown[]) =>
                        event.execute(...args)
                    );
                } else {
                    client.on(event.name, (...args: unknown[]) =>
                        event.execute(...args)
                    );
                }
            } catch (err) {
                console.log(`error while importing discord event files: ${err}`);
            }
        }
        console.log(`registered client events`);

        await client.login(TOKEN);
    }
}

main().catch(console.error);
