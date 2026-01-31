# 📱 Flutter Profile Implementation Guide (Clean Architecture)

This guide details how to implement the **Profile Update** feature (including Image Upload) in your Flutter app using **Clean Architecture** and **Hive** for local caching.

## 1. 🔌 API & Payload Reference

We will be connecting to the `PUT /api/profile` endpoint which supports **Multipart/Form-Data**.

**Endpoint:** `http://YOUR_IP:4000/api/profile`
**Method:** `PUT`
**Headers:**
- `Authorization`: `Bearer <ACCESS_TOKEN>`
- `Content-Type`: `multipart/form-data`

**Payload Fields:**
- `name` (String)
- `phone` (String)
- `speciality` (String)
- `address` (String)
- `profileImage` (File)

---

## 2. 📂 Folder Structure

```
lib/features/profile/
├── data/
│   ├── datasources/
│   │   ├── profile_local_data_source.dart  <-- Hive Implementation
│   │   └── profile_remote_data_source.dart <-- Dio Implementation
│   ├── models/
│   │   └── profile_model.dart              <-- Hive Adapter & JSON
│   └── repositories/
│       └── profile_repository_impl.dart
├── domain/
│   ├── entities/
│   │   └── profile_entity.dart
│   ├── repositories/
│   │   └── profile_repository.dart
│   └── usecases/
│       ├── get_profile_usecase.dart
│       └── update_profile_usecase.dart
└── presentation/
    ├── bloc/
    │   └── profile_bloc.dart
    └── pages/
        └── edit_profile_page.dart
```

---

## 3. 🧠 Domain Layer (Business Logic)

### Entity (`profile_entity.dart`)
```dart
class ProfileEntity {
  final String id;
  final String email;
  final String name;
  final String phone;
  final String speciality;
  final String address;
  final String? profileImage; // URL string

  ProfileEntity({
    required this.id,
    required this.email,
    required this.name,
    required this.phone,
    required this.speciality,
    required this.address,
    this.profileImage,
  });
}
```

### Repository Interface (`profile_repository.dart`)
```dart
abstract class IProfileRepository {
  Future<Either<Failure, ProfileEntity>> getProfile();
  
  // Notice 'image' is a File object here
  Future<Either<Failure, ProfileEntity>> updateProfile({
    required String name,
    required String phone,
    required String speciality,
    required String address,
    File? image, 
  });
}
```

### UseCase (`update_profile_usecase.dart`)
```dart
class UpdateProfileUseCase {
  final IProfileRepository repository;

  UpdateProfileUseCase(this.repository);

  Future<Either<Failure, ProfileEntity>> call(UpdateProfileParams params) {
    return repository.updateProfile(
      name: params.name,
      phone: params.phone,
      speciality: params.speciality,
      address: params.address,
      image: params.image,
    );
  }
}
```

---

## 4. 💾 Data Layer (Data Handling)

### Model (`profile_model.dart`)
*Annotated for Hive Storage*

```dart
import 'package:hive/hive.dart';

part 'profile_model.g.dart';

@HiveType(typeId: 1) // Ensure unique ID
class ProfileModel extends ProfileEntity {
  @HiveField(0) final String id;
  @HiveField(1) final String email;
  @HiveField(2) final String name;
  @HiveField(3) final String phone;
  @HiveField(4) final String speciality;
  @HiveField(5) final String address;
  @HiveField(6) final String? profileImage;

  ProfileModel({
    required this.id,
    required this.email,
    required this.name,
    required this.phone,
    required this.speciality,
    required this.address,
    this.profileImage,
  }) : super(id: id, email: email, name: name, phone: phone, speciality: speciality, address: address, profileImage: profileImage);

  factory ProfileModel.fromJson(Map<String, dynamic> json) {
    return ProfileModel(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      name: json['name'] ?? '',
      phone: json['phone'] ?? '',
      speciality: json['speciality'] ?? '',
      address: json['address'] ?? '',
      profileImage: json['profileImage'],
    );
  }
}
```

### Remote Data Source (`profile_remote_data_source.dart`)
**Critical:** Uses `FormData` for multipart upload.

```dart
import 'package:dio/dio.dart';

abstract class ProfileRemoteDataSource {
  Future<ProfileModel> updateProfile(Map<String, String> fields, File? file);
}

class ProfileRemoteDataSourceImpl implements ProfileRemoteDataSource {
  final Dio dio;

  ProfileRemoteDataSourceImpl({required this.dio});

  @override
  Future<ProfileModel> updateProfile(Map<String, String> fields, File? file) async {
    try {
      String fileName = file != null ? file.path.split('/').last : "";
      
      // 1. Prepare Form Data
      FormData formData = FormData.fromMap({
        ...fields,
        if (file != null)
          "profileImage": await MultipartFile.fromFile(
            file.path,
            filename: fileName,
          ),
      });

      // 2. Make Request (PUT)
      // Note: Interceptors should handle adding the 'Authorization' header
      final response = await dio.put(
        '/api/profile',
        data: formData,
      );

      // 3. Return Parsed Model
      // Assuming backend returns: { "message": "...", "profile": { ... } }
      return ProfileModel.fromJson(response.data['profile']);
      
    } catch (e) {
      throw ServerException();
    }
  }
}
```

### Local Data Source (`profile_local_data_source.dart`)
*Handles caching with Hive*

```dart
abstract class ProfileLocalDataSource {
  Future<void> cacheProfile(ProfileModel profile);
  Future<ProfileModel> getLastProfile();
}

class ProfileLocalDataSourceImpl implements ProfileLocalDataSource {
  final Box<ProfileModel> profileBox;

  ProfileLocalDataSourceImpl({required this.profileBox});

  @override
  Future<void> cacheProfile(ProfileModel profile) async {
    await profileBox.put('cached_profile', profile);
  }

  @override
  Future<ProfileModel> getLastProfile() async {
    final profile = profileBox.get('cached_profile');
    if (profile != null) {
      return profile;
    } else {
      throw CacheException();
    }
  }
}
```

---

## 5. 🎨 Presentation Layer (UI & Logic)

### BLoC / Provider Logic
When the user clicks "Save":
1.  Check for Internet Connection.
2.  If Online: Call `updateProfileUseCase`.
3.  On Success: 
    - Save the returned `ProfileModel` to Hive (`cacheProfile`).
    - Update UI with new data.
4.  If Offline: Show error or queue action (depending on complexity).

### Implementation Snippet for Bloc
```dart
on<UpdateProfileEvent>((event, emit) async {
  emit(ProfileLoading());
  
  final result = await updateProfileUseCase(UpdateProfileParams(
    name: event.name,
    phone: event.phone,
    address: event.address,
    speciality: event.speciality,
    image: event.imageFile, // File object from ImagePicker
  ));

  result.fold(
    (failure) => emit(ProfileError(message: _mapFailureToMessage(failure))),
    (profile) {
      // Data is already updated in Cloud and Hive by the Repository
      emit(ProfileLoaded(profile: profile));
    },
  );
});
```

### Image Picker Integration (UI)
Use the `image_picker` package in your widget.

```dart
File? _selectedImage;

Future<void> _pickImage() async {
  final picker = ImagePicker();
  final pickedFile = await picker.pickImage(source: ImageSource.gallery);

  if (pickedFile != null) {
    setState(() {
      _selectedImage = File(pickedFile.path);
    });
  }
}

// In your build method:
GestureDetector(
  onTap: _pickImage,
  child: _selectedImage != null 
     ? Image.file(_selectedImage!) 
     : NetworkImage(state.profile.profileImage),
)
```

---

## 6. 🚀 Key Checklist for Success

1.  **Dio Interceptor:** Ensure your Dio instance has an interceptor that automatically adds `Authorization: Bearer <TOKEN>` to every request.
2.  **FormData:** You MUST use `FormData` for the `PUT` request if sending an image. Sending a raw JSON body will cause the image upload to fail.
3.  **Hive Adapter:** Don't forget to run `flutter pub run build_runner build` to generate the Hive TypeAdapter.
4.  **Backend Connection:** Ensure your Emulator/Device uses the computer's correct IP address (e.g., `10.0.2.2` for Android Emulator), **NOT** `localhost`.

