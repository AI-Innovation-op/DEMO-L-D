extends CharacterBody3D

class_name EnemyAI

@export var speed: float = 2.8
@export var attack_range: float = 2.2
@export var windup_duration: float = 0.48

enum State { CHASE, WINDUP, ATTACK, RECOVERY, STUNNED, DEAD }
var current_state: State = State.CHASE
var timer: float = 0.0
var health: int = 120

@onready var player: Node3D = get_tree().get_first_node_in_group("player")
@onready var warning_indicator: MeshInstance3D = $WarningIndicator

func _physics_process(delta: float) -> void:
	if current_state == State.DEAD or not player:
		return

	var dist = global_position.distance_to(player.global_position)
	var dir = (player.global_position - global_position).normalized()
	dir.y = 0

	match current_state:
		State.CHASE:
			warning_indicator.visible = false
			if dist > attack_range:
				velocity.x = dir.x * speed
				velocity.z = dir.z * speed
				look_at(Vector3(player.global_position.x, global_position.y, player.global_position.z))
			else:
				velocity = Vector3.ZERO
				current_state = State.WINDUP
				timer = windup_duration
				warning_indicator.visible = true

		State.WINDUP:
			velocity = Vector3.ZERO
			timer -= delta
			warning_indicator.visible = fmod(timer * 10, 1.0) > 0.5
			if timer <= 0:
				warning_indicator.visible = false
				current_state = State.ATTACK
				_execute_attack()

		State.RECOVERY:
			velocity = Vector3.ZERO
			timer -= delta
			if timer <= 0:
				current_state = State.CHASE

		State.STUNNED:
			velocity = Vector3.ZERO
			timer -= delta
			if timer <= 0:
				current_state = State.RECOVERY
				timer = 0.5

	move_and_slide()

func _execute_attack() -> void:
	var dist = global_position.distance_to(player.global_position)
	if dist <= attack_range + 0.5:
		if player.is_guarding:
			# Parry triggered!
			current_state = State.STUNNED
			timer = 1.4
			return
		elif not player.is_dodging:
			player.health -= 18
	
	current_state = State.RECOVERY
	timer = 0.4
