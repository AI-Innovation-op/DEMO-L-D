extends CharacterBody3D

class_name PlayerController

# Movement & Physics
@export var speed: float = 5.0
@export var dodge_speed: float = 10.0
@export var rotation_speed: float = 12.0

# Combat State
var health: int = 100
var max_health: int = 100
var is_armed: bool = true
var is_guarding: bool = false
var is_dodging: bool = false
var is_attacking: bool = false
var dodge_timer: float = 0.0

@onready var sword_mesh: Node3D = $Visuals/Sword
@onready var camera_pivot: Node3D = $CameraPivot

func _physics_process(delta: float) -> void:
	if is_dodging:
		dodge_timer -= delta
		if dodge_timer <= 0:
			is_dodging = false
		move_and_slide()
		return

	# Handle Combat Inputs
	if Input.is_action_just_pressed("attack_light") and not is_attacking:
		_execute_attack(false)
	elif Input.is_action_just_pressed("attack_heavy") and not is_attacking:
		_execute_attack(true)
	elif Input.is_action_just_pressed("throw_weapon") and is_armed:
		_throw_weapon()
	elif Input.is_action_just_pressed("dodge") and dodge_timer <= 0:
		_execute_dodge()

	is_guarding = Input.is_action_pressed("guard")

	# Movement (WASD)
	var input_dir := Input.get_vector("move_left", "move_right", "move_forward", "move_backward")
	var direction := (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()

	if direction and not is_attacking:
		velocity.x = direction.x * speed
		velocity.z = direction.z * speed
		
		# Rotate character facing movement
		var target_rotation = atan2(direction.x, direction.z)
		rotation.y = lerp_angle(rotation.y, target_rotation, rotation_speed * delta)
	else:
		velocity.x = move_toward(velocity.x, 0, speed)
		velocity.z = move_toward(velocity.z, 0, speed)

	move_and_slide()

func _execute_attack(is_heavy: bool) -> void:
	is_attacking = true
	var duration = 0.45 if is_heavy else 0.28
	# Trigger attack animation and raycast hit against enemies
	await get_tree().create_timer(duration).timeout
	is_attacking = false

func _execute_dodge() -> void:
	is_dodging = true
	dodge_timer = 0.35
	velocity = -transform.basis.z * dodge_speed

func _throw_weapon() -> void:
	is_armed = false
	sword_mesh.visible = false
	# Instantiate dropped sword projectile in scene

func retrieve_weapon() -> void:
	is_armed = true
	sword_mesh.visible = true
