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
    },
    {
        height: 200,
        points: 5,
    },
    {
        height: 300,
        points: 1,
    },
]

let setup = true;
let game_running = false;
let paused_drawn = false;
let l_key_down = false;
let r_key_down = false;

let score = 0;

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
        l_key_down = true;
    }
    if (event.key === 'ArrowRight') {
        r_key_down = true;
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowLeft') {
        l_key_down = false;
    }
    if (event.key === 'ArrowRight') {
        r_key_down = false;
    }
    if (event.code === 'Space') {
        game_running = !game_running;
    }
});

setInterval(() => {
    if (!game_running && !setup) {
        if (!paused_drawn) {
            context.fillStyle = 'rgba(0, 0, 0, 0.5)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#ffffff';
            context.font = '60px Arial Bold';
            const paused_text_dimensions = context.measureText('||');
            context.fillText('||', (canvas.width / 2) - (paused_text_dimensions.width / 2), (canvas.height / 2) + 30);

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
        }

        zone_offset += zone.height;
    }

    context.fillStyle = '#ffffff';

    for (let platform_index = 0; platform_index < platforms.length; platform_index++) {
        context.fillRect(platforms[platform_index].position.x, platforms[platform_index].position.y, platforms[platform_index].width, 5);
        platforms[platform_index].position.y += 0.5;

        if (platforms[platform_index].position.y >= canvas.height) {
            platforms.splice(platform_index, 1);
        }

        if (player.velocity.y < 0
            && player.position.y + player.size >= platforms[platform_index].position.y
            && player.position.y + player.size <= platforms[platform_index].position.y + 6
            && player.position.x + player.size >= platforms[platform_index].position.x
            && player.position.x - player.size <= platforms[platform_index].position.x + (platforms[platform_index].width / 2)) {
            player.velocity.y += 8;
        }
    }

    for (let enemy_index = 0; enemy_index < enemies.length; enemy_index++) {
        context.fillRect(enemies[enemy_index].position.x, enemies[enemy_index].position.y, enemies[enemy_index].size, enemies[enemy_index].size);
        enemies[enemy_index].position.y += enemies[enemy_index].speed;

        if (enemies[enemy_index].position.y >= canvas.height) {
            enemies.splice(enemy_index, 1);
        }

        // enemy collision here
    }

    context.fillRect(player.position.x, player.position.y, player.size, player.size);

    const score_text = score.toString();

    context.fillStyle = '#000000';
    context.fillText(score_text, 7, 37);

    context.fillStyle = '#ffffff';
    context.fillText(score_text, 5, 35);

    // end of drawing

    if (player.velocity.x !== 0) {
        player.position.x += player.velocity.x;

        if (player.velocity.x > 0) {
            player.velocity.x -= 0.1;
        } else {
            player.velocity.x += 0.1;
        }

        if (player.position.x + player.size >= canvas.width) {
            player.position.x = canvas.width - player.size;
        }

        if (player.position.x <= 0) {
            player.position.x = 0;
        }
    }

    if (player.velocity.y !== 0) {
        player.position.y -= player.velocity.y;

        if (player.velocity.y > -3) {
            player.velocity.y -= 0.1;
        }

        if (player.position.y + player.size >= canvas.height) {
            player.velocity.y += 8;
        }
    }

    if (l_key_down) {
        if (player.velocity.x > -3) {
            player.velocity.x -= 0.3;
        }

        if (player.velocity.x < -3) {
            player.velocity.x = -3;
        }
    }

    if (r_key_down) {
        if (player.velocity.x < 3) {
            player.velocity.x += 0.3;
        }

        if (player.velocity.x > 3) {
            player.velocity.x = 3;
        }
    }

    if (player.velocity.x > -0.1 && player.velocity.x < 0.1) {
        player.velocity.x = 0;
    }
}, 1);

setInterval(() => {
    if (!game_running) {
        return;
    }

    if (platforms.length < 20) {
        const width = Math.random() * (60 - 40) + 40;

        platforms.push({
                position: {
                    x: Math.random() * canvas.width - width,
                    y: 0,
                },
                width: width,
            }
        )
    }
}, 500);

setInterval(() => {
    if (!game_running) {
        return;
    }

    if (enemies.length < 5) {
        const size = Math.random() * (10 - 2) + 2;

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
}, 1000);