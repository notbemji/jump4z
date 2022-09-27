const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');

let player = {
    position: {
        x: canvas.width / 2 - 10,
        y: 700,
    },
    size: 20,
    velocity: {
        x: 0,
        y: -1,
    },
    max_velocity: {
        x: 5,
        y: 8,
    }
};

let platforms = [
    {
        position: {
            x: canvas.width / 2 - 20,
            y: 0,
        },
        width: 40,
    }
];

let enemies = [
    {
        position: {
            x: 0,
            y: -10,
        },
        size: 0,
        speed: 0,
    },
]

const zones = [
    {
        height: 150,
        points: 15,
        score_jitter: 70,
    },
    {
        height: 200,
        points: 5,
        score_jitter: 20,
    },
    {
        height: 300,
        points: 1,
        score_jitter: 2,
    },
]

let setup = true;
let game_running = false;
let paused_drawn = false;
let death_screen_drawn = false;
let death_screen = false;
let l_key_down = false;
let r_key_down = false;
let last_update = Date.now();
let delta_time;
let last_platform_spawn = Date.now();
let last_enemy_spawn = Date.now();
let lives = 5;
let health_bar_width = lives * 35;
let bounce_score = 0;

// settings
let mirror_edges = true;
let enemies_enabled = true;

let notification = {
    text: '',
    time: 0,
    max_time: 0,
    color: '#000000',
};

let score = 0;

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.code === 'KeyA') {
        l_key_down = true;
    }
    if (event.key === 'ArrowRight' || event.code === 'KeyD') {
        r_key_down = true;
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowLeft' || event.code === 'KeyA') {
        l_key_down = false;
    }
    if (event.key === 'ArrowRight' || event.code === 'KeyD') {
        r_key_down = false;
    }
    if (event.code === 'Space') {
        if (death_screen) {
            window.location.reload();
        }

        game_running = !game_running;
    }
    if (event.code === 'KeyF') {
        notification = {
            text: 'test',
            time: 100,
            max_time: 100,
            color: '0, 255, 0',
        };
    }
    if (event.code === 'KeyM') {
        mirror_edges = !mirror_edges;
        notification = {
            text: 'Mirroring ' + (mirror_edges ? 'enabled' : 'disabled'),
            time: 100,
            max_time: 100,
            color: mirror_edges ? '0, 255, 0' : '255, 0, 0',
        };
    }
    if (event.code === 'KeyN') {
        enemies_enabled = !enemies_enabled;
        notification = {
            text: 'Enemies ' + (enemies_enabled ? 'enabled' : 'disabled'),
            time: 100,
            max_time: 100,
            color: enemies_enabled ? '0, 255, 0' : '255, 0, 0',
        };
    }
});

const max_speed = 5;
const acceleration = 1.05;
const jump_height = 6.6;

function run() {
    let now = Date.now();
    delta_time = (now - last_update) / (5);
    last_update = now;

    if (death_screen) {
        if (!death_screen_drawn) {
            context.fillStyle = 'rgba(0, 0, 0, 0.5)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#ff0000';
            context.font = '60px Arial Bold';
            const paused_text_dimensions = context.measureText('YOU DIED');
            context.fillText('YOU DIED', (canvas.width / 2) - (paused_text_dimensions.width / 2), (canvas.height / 2) + 10);
            context.font = '20px Arial Bold';
            const paused_continue_text_dimensions = context.measureText('Press SPACE to retry.');
            context.fillText('Press SPACE to retry.', (canvas.width / 2) - (paused_continue_text_dimensions.width / 2), (canvas.height / 2) + 65);
            death_screen_drawn = true;
        }

        return;
    }

    if (!game_running && !setup) {
        if (!paused_drawn) {
            context.fillStyle = 'rgba(0, 0, 0, 0.5)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#ffffff';
            context.font = '60px Arial Bold';
            const paused_text_dimensions = context.measureText('||');
            context.fillText('||', (canvas.width / 2) - (paused_text_dimensions.width / 2), (canvas.height / 2) + 10);
            context.font = '20px Arial Bold';
            const paused_continue_text_dimensions = context.measureText('Press SPACE to continue.');
            context.fillText('Press SPACE to continue.', (canvas.width / 2) - (paused_continue_text_dimensions.width / 2), (canvas.height / 2) + 65);

            paused_drawn = true;
        }

        return;
    }

    if (setup === true) {
        setup = false;
    }

    if (paused_drawn === true) {
        paused_drawn = false;
    }

    if (!enemies_enabled) {
        if (enemies.length) {
            enemies = [];
        }
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = '40px Arial';

    let zone_offset = 0;
    for (const zone of zones) {
        context.fillStyle = 'hsl(' + (zone.points * 8) + ', 100%, 25%)';
        context.fillRect(0, zone_offset, canvas.width, zone.height);
        const points_text = '+' + zone.points.toString();
        const text_dimensions = context.measureText(points_text);
        const points_text_x = (canvas.width / 2) - (text_dimensions.width / 2);
        const points_text_y = zone_offset + (zone.height / 2) + 20;
        context.fillStyle = 'hsl(' + (zone.points * 8) + ', 100%, 20%)';
        context.fillText(points_text, points_text_x + 2, points_text_y + 2);
        context.fillStyle = 'hsl(' + (zone.points * 8) + ', 100%, 50%)';
        context.fillText(points_text, points_text_x, points_text_y);

        if (player.position.y + player.size <= zone_offset + zone.height) {
            score += zone.points;
            bounce_score = zone.score_jitter;
        }

        zone_offset += zone.height;
    }

    context.fillStyle = '#ffffff';

    for (let platform_index = 0; platform_index < platforms.length; platform_index++) {
        context.fillRect(platforms[platform_index].position.x, platforms[platform_index].position.y, platforms[platform_index].width, 5);
        platforms[platform_index].position.y += 0.5 * delta_time;

        if (platforms[platform_index].position.y >= canvas.height) {
            platforms.splice(platform_index, 1);
        }

        if (player.velocity.y < 0
            && player.position.y + player.size >= platforms[platform_index].position.y
            && player.position.y + player.size <= platforms[platform_index].position.y + 6
            && player.position.x + player.size >= platforms[platform_index].position.x
            && player.position.x - player.size <= platforms[platform_index].position.x + (platforms[platform_index].width / 2)) {
            player.velocity.y += jump_height;
        }
    }

    for (let enemy_index = 0; enemy_index < enemies.length; enemy_index++) {
        context.fillStyle = '#ff0000';
        context.fillRect(enemies[enemy_index].position.x, enemies[enemy_index].position.y, enemies[enemy_index].size, enemies[enemy_index].size);
        enemies[enemy_index].position.y += enemies[enemy_index].speed * delta_time;

        if (enemies[enemy_index].position.y >= canvas.height) {
            enemies.splice(enemy_index, 1);
        }

        const enemy_center_x = enemies[enemy_index].position.x + (enemies[enemy_index].size / 2);
        const enemy_center_y = enemies[enemy_index].position.y + (enemies[enemy_index].size / 2);

        // enemy collision here
        if (enemy_center_x >= player.position.x
            && enemy_center_x <= player.position.x + player.size
            && enemy_center_y >= player.position.y
            && enemy_center_y <= player.position.y + player.size) {
            enemies.splice(enemy_index, 1);
            lives--;

            if (lives === 0) {
                game_running = false;
                death_screen = true;
            }
        }
    }

    context.fillStyle = '#ffffff';
    context.fillRect(player.position.x, player.position.y, player.size, player.size);

    const score_text = score.toString();
    const add_x = bounce_score ? Math.random() * (bounce_score - -bounce_score) + -bounce_score : 0;
    const add_y = bounce_score ? Math.random() * (bounce_score - -bounce_score) + -bounce_score : 0;

    if (bounce_score) {
        bounce_score = 0;
    }

    context.fillStyle = '#000000';
    context.fillText(score_text, 7 + add_x, 37 + add_y);

    context.fillStyle = '#ffffff';
    context.fillText(score_text, 5 + add_x, 35 + add_y);

    // health bar
    if (enemies_enabled) {
        context.fillStyle = '#000000';
        context.fillRect(canvas.width - 175 - 5, 5, 175, 35);
        context.fillStyle = '#ff0000';
        context.fillRect(canvas.width - 175 - 3, 7, health_bar_width - 4, 31);
        if (health_bar_width > lives * 35) {
            health_bar_width -= 0.5 * delta_time;
        }
    }

    if (notification.text && notification.time > 0) {
        context.fillStyle = 'rgba(' + notification.color + ', ' + 100 * (notification.time / notification.max_time) + '%)';
        const font_size = 20 + (20 * (1 - (notification.time / notification.max_time)));
        context.font = font_size + 'px Arial Bold';
        const notification_text_dimensions = context.measureText(notification.text);
        context.fillText(notification.text, (canvas.width / 2) - (notification_text_dimensions.width / 2), (canvas.height / 2) + (font_size / 2));
        notification.time -= delta_time;
    }

    // end of drawing

    if (player.velocity.x !== 0) {
        player.position.x += player.velocity.x * delta_time;

        if (player.velocity.x > 0) {
            player.velocity.x -= 0.1;
        } else {
            player.velocity.x += 0.1;
        }

        if (player.position.x + player.size >= canvas.width) {
            if (mirror_edges) {
                player.position.x = 1;
            }
            else {
                player.position.x = canvas.width - player.size;
            }
        }

        if (player.position.x <= 0) {
            if (mirror_edges) {
                player.position.x = canvas.width - player.size - 1;
            }
            else {
                player.position.x = 0;
            }
        }
    }

    if (player.velocity.y !== 0) {
        player.position.y -= player.velocity.y * delta_time;

        if (player.velocity.y > -3) {
            player.velocity.y -= 0.05;
        }

        if (player.position.y + player.size >= canvas.height) {
            player.velocity.y += jump_height;
        }
    }

    if (l_key_down) {
        if (player.velocity.x > -max_speed) {
            player.velocity.x -= acceleration;
        }

        if (player.velocity.x < -max_speed) {
            player.velocity.x = -max_speed;
        }
    }

    if (r_key_down) {
        if (player.velocity.x < max_speed) {
            player.velocity.x += acceleration;
        }

        if (player.velocity.x > max_speed) {
            player.velocity.x = max_speed;
        }
    }

    if (player.velocity.x > -0.1 && player.velocity.x < 0.1) {
        player.velocity.x = 0;
    }

    if (player.velocity.x > 0 && player.velocity.x > player.max_velocity.x) {
        player.velocity.x = player.max_velocity.x;
    }

    if (player.velocity.x < 0 && player.velocity.x < -player.max_velocity.x) {
        player.velocity.x = -player.max_velocity.x;
    }

    if (player.velocity.y > 0 && player.velocity.y > player.max_velocity.y) {
        player.velocity.y = player.max_velocity.y;
    }

    if (player.velocity.y < 0 && player.velocity.y < -player.max_velocity.y) {
        player.velocity.y = -player.max_velocity.y;
    }

    if (now - last_platform_spawn >= 1000) {
        if (platforms.length < 20) {
            const width = Math.random() * (60 - 40) + 40;

            platforms.push({
                    position: {
                        x: Math.random() * canvas.width - width,
                        y: 0,
                    },
                    width,
                }
            )
        }

        last_platform_spawn = Date.now();
    }


    if (now - last_enemy_spawn >= 500) {
        if (enemies.length < 20) {
            const size = Math.random() * (14 - 6) + 6;

            enemies.push({
                    position: {
                        x: Math.random() * canvas.width - size,
                        y: 0,
                    },
                    size,
                    speed: Math.random() * (5 - 1) + 1,
                }
            )
        }

        last_enemy_spawn = Date.now();
    }
}

setInterval(() => {
    run();
}, 0);