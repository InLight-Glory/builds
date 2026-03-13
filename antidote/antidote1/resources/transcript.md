0:00
Most people assume a team made this, but
0:03
it was made by one nerdy dude. Hi. To
0:07
make [music] this happen, I needed
0:08
handdrawn environments, but I can't
0:10
draw. I needed dozens of painted
0:12
buildings, which I don't have time for,
0:15
and I wanted thousands of enemies on the
0:17
screen. I didn't use AI.
0:21
[music]
0:23
I couldn't hire a team.
0:27
And no, I don't secretly have a
0:29
publisher.
0:30
[music]
0:31
I'll show you how I generate seamless
0:33
handdrawn textures without being an
0:36
artist.
0:38
How my materials adapt automatically
0:40
instead of being repainted, and how
0:42
every bullet, explosion, and enemy gets
0:45
reused so the game never slows down.
0:49
15 months ago, my game landed on Steam's
0:52
popular upcoming and did six figures in
0:55
revenue. Then I disappeared.
1:00
Since then, I've been building this
1:02
between my day job and dad duty. It's a
1:04
base building survival game with
1:06
terraforming and crafting. Earth lies
1:09
poisoned and abandoned 10,000 years
1:11
after invasion. You awaken from stasis
1:14
to defend a fragile foothold and slowly
1:16
bring a dead world back to life so
1:19
humanity can live here again. I call it
1:22
Project Tomorrow.
Why Project Tomorrow?
1:25
But wait, let's back up. Why Project
1:27
Tomorrow? I've always been drawn to
1:29
dystopian stories about broken worlds
1:31
[music] that need healing. I love the
1:32
silo books. I've sunk countless hours
1:35
into Fallout, and I think Wall-E is one
1:37
of the greatest movies ever made. My
1:40
5-year-old is obsessed with it right
1:42
now, and rediscovering it with him
1:44
[music] reminded me why these stories
1:45
matter. There's something powerful about
1:48
fighting for a future that isn't
1:49
guaranteed. I'm also that kind of crazy
1:52
person who believes in conspiracy
1:53
theories like global warming is real and
1:56
the planet might actually need our help.
1:58
My first mobile game was called Hamster
2:01
Power. It was about generating clean
2:03
energy with hamsters and if players
2:05
progressed far enough, I would plant a
2:06
tree in real life. Players all over the
2:09
world joined in. We planted more than
2:11
200 trees together. It didn't save the
2:13
planet, but it did mean something to me
2:16
because at the end of the day, that's
2:18
what Project Tomorrow is all about. a
2:20
world that's been broken and the belief
2:22
that maybe if someone tries they can
2:24
bring it [music] back. This is where I
2:26
started. A barren desert, no vegetation,
2:29
flat textures. The enemies could only
2:31
move in straight lines and they [music]
2:33
couldn't attack. Everything you see now
2:36
had to be built from scratch. Not by
2:38
hand, but by building systems that could
2:40
do the work for me. If I had to paint
Painting With Math
2:42
every surface in this game by hand, I'd
2:45
still be painting every cliff, every
2:48
rock, every terrain tile. [music] That
2:50
doesn't scale. So instead of painting
2:53
assets, I built a system that paints
2:55
them for me. Not with AI, with rules. In
2:59
Substance Designer, I can build
3:00
materials out of math, noise patterns,
3:03
tile samplers, and blends combined in
3:05
ways that I can adjust at any time.
3:08
Change one value, and the entire surface
3:10
updates. This file is called a graph.
3:13
And one graph can generate endless
3:15
variations. So instead of creating
3:18
hundreds of hand painted textures, I
3:20
created a recipe that paints them for
3:22
me. But I can get so much [music] more
3:24
than color out of these graphs. This
3:26
floor is completely flat. No extra
3:28
geometry, just a simple square. But
3:30
watch what happens when I enable this.
3:34
All of that detail. It isn't real
3:36
geometry. With this graph, I can
3:39
generate something called a normal map.
3:41
A normal map is just a texture. It
3:44
doesn't add polygons. It adds lighting
3:46
information. So, the surfaces in the
3:48
game can look complex without actually
3:50
being complex. I get the visual detail
3:53
of sculpted assets without sculpting
3:56
anything. Cliffs instantly look rockier.
3:59
Grass shows individual [music] blades on
4:01
what is actually flat geometry. It tiles
4:04
perfectly. It blends perfectly. and I
4:06
can regenerate it whenever I need to.
4:10
Next, I'll show you how I automated
4:12
building textures. But first, a quick
4:14
personal request. I've just made the
4:16
Project Tomorrow Steam page public
4:18
today. If you want to support the
4:19
project, wish listing helps more than
4:21
anything else. It tells Steam this game
4:24
is worth showing to more people. It
4:26
takes one click and it makes a huge
Procedural Texturing (Without Being an Artist)
4:28
difference. There's a link in the
4:30
description. Now, let's talk about how I
4:32
painted dozens of buildings with a
4:33
system. Buildings are the same idea as
4:35
the environment. Instead of hand
4:37
painting every asset, I use smart
4:39
materials within Substance Painter that
4:41
react to the geometry. Edgeware appears
4:44
instantly. Dirt collects in crevices.
4:47
Color variation happens automatically. I
4:50
don't paint assets. The material does
4:52
the work so that I don't have to. One
4:54
last detail. It's subtle, but it's cool.
4:57
Even the leaves are procedural. In
4:59
Blender, I place simple spheres on a
5:00
trunk. Then geometry nodes scatter leaf
5:03
card meshes across them. Each card is
5:05
six-sided, so the leaves hold up from
5:07
any angle. Add a texture and the tree
5:09
builds itself.
5:14
[music]
Building Systems That Build the World
5:15
Because the environment is driven by
5:16
data, it can react in real time. The art
5:19
responds to gameplay, not the other way
5:21
around. You aren't just building
5:23
defenses and terraforming [music]
5:25
machines. You're rebuilding the planet.
5:27
The more you build, the more the world
5:29
heals. Dead ground comes back to life.
5:34
Vegetation returns.
5:37
[music]
5:38
Water becomes clean again.
5:42
I didn't create every version of this
5:44
planet. I created a set of rules to
5:47
generate it automatically. That's how
5:49
one developer builds [music] a world
5:50
that feels like a team made it.
5:56
Even the player animations are
5:57
systemdriven. When the enemies surround
5:59
you, the player has to snap between
6:01
targets. Traditional animations break
6:04
here. They look stiff or delayed. So,
6:06
instead of rotating the body first, I
6:09
rotate the weapon and let the body react
6:11
to it. Getting the math right took way
6:13
too long.
6:15
Looks like a shooting chicken.
6:18
Okay, so the gun's going through her
6:20
body and the [music] hand is dancing.
6:25
I don't even know what this is. the
6:28
stuff of nightmares.
6:30
The payoff is huge. Now, the animations
6:33
generate themselves for every [music]
6:35
weapon.
Enemies, Bullets & Performance Chaos
6:38
Next comes the fun stuff. Enemies,
6:40
bullets, and explosions. And just like
6:42
the environment, they're driven by
6:44
systems. Because the game isn't
6:46
scripted, it's simulated.
6:49
Water keeps you alive, but water also
6:52
grows your food. Terraforming unlocks
6:55
stronger defenses, but you need defenses
6:58
to protect your terraforming.
7:01
Every system pushes against [music]
7:03
another. The game responds to your
7:05
decisions and gameplay emerges from that
7:07
tension. Which means I'm not building
7:09
every moment. I'm building systems and
7:12
letting them create the gameplay
7:14
themselves. Because textures don't make
7:16
a game feel big. It feels big because of
7:19
activity. bullets, explosions, enemies
7:22
constantly appearing and disappearing.
7:24
But under the hood, that's a problem.
7:29
Every time something spawns and gets
7:31
destroyed, the hardware has to allocate
7:33
memory and then free it. Do that enough
7:35
times and performance starts to fall
7:37
apart.
7:39
So instead of creating and destroying
7:41
objects, I reuse them. This bullet isn't
7:44
new, it's recycled. When a bullet hits
7:46
something, it doesn't get destroyed. it
7:48
goes back to a pool ready to be used
7:50
again. Enemies work the same way. They
7:53
aren't constantly created and destroyed.
7:55
They're reused. That means the game
7:57
isn't wasting time managing memory. It's
8:00
spending time running the simulation.
8:02
This lets the game handle far more
8:04
activity without slowing down. But reuse
8:07
alone isn't enough. To reach this scale,
8:09
the entire game has to be built
8:11
differently. This is where architecture
8:14
takes over. Normally, each enemy in a
8:16
game runs on its own logic. That works
8:19
until you do it thousands of times, then
8:21
the overhead becomes a bottleneck. So,
8:23
instead of building the game around
8:25
individual enemies, I built it around
8:27
shared systems. If you're techy, this is
8:30
called [music] DOTS. If not, here's the
8:32
simple version. Computers have multiple
8:34
cores. Even mobile hardware like the
8:36
Steam Deck has four [music] cores. Most
8:38
games only use one at a time, but with
8:40
this design, I can use all of them
8:42
simultaneously. That means more enemies,
8:45
more bullets, more chaos.
8:49
Movement is one system, targeting is
8:51
another, damage is another. Each system
8:54
updates every enemy at once, so the
8:57
enemies stop behaving like individuals
8:59
and start behaving like a coordinated
9:01
[music] force, a hive mind probing your
9:03
defenses.
9:04
I also use burst, which makes it even
9:07
faster. It translates my code into
9:09
highly optimized machine instructions,
9:11
letting all the cores process thousands
9:13
of enemies at [music] the same time. So,
9:15
I'm not simulating a few enemies. I'm
9:17
simulating an army. I didn't build this
9:20
by working harder. I built it by
9:22
building smarter systems. Building a big
9:24
game isn't about doing everything. It's
9:26
about building the right systems so the
9:28
game can build itself. That's Project
9:31
Tomorrow. If you want to see how far one
9:33
developer can push this idea, wish list
9:35
Project Tomorrow on Steam, because this
9:38
is only the beginning.