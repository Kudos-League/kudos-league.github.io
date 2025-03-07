import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

interface User {
    id: number;
    name: string;
    kudos: number;
    interests: string[];
    description: string;
    profilePicture: string;
}

interface Post {
    id: number;
    title: string;
    body: string;
    type: string;
    images?: string[];
    kudos?: number;
    isActive?: boolean;
    tags?: Array<{ id: string; name: string }>;
    sender: {
        id: string;
        username: string;
        avatar?: string;
        kudos: number;
    };
}

interface Feat {
    location: string;
    date: Date;
    placement: number;
    description: string;
}

interface PostCardProps {
    post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
    return (
        <View style={styles.postCard}>
            <View style={styles.postContent}>
                <Text style={styles.postTitle}>{post.title}</Text>
                <View style={[styles.tagPill, styles.tagDark]}>
                    <Text style={styles.tagText}>{post.type === 'gift' ? 'Gift' : 'ReQuest'}</Text>
                </View>
            </View>
            {post.images && post.images.length > 0 ? (
                <Image source={{ uri: post.images[0] }} style={styles.postImage} />
            ) : (
                <Text style ={styles.noImageText}>{post.body}</Text>
            )}
            {post.isActive ? (
                <Text style={styles.kudosText}>Active</Text>
            ): (
                <Text style={styles.kudosText}>{post.kudos} Kudos</Text>
            )}
        </View>
    );
};

const ProfilePage = () => {
    const [filter, setFilter] = React.useState("all");
    
    // Mock user data
    const user: User = {
        id: 1,
        name: "Annette Black",
        kudos: 54832,
        interests: ["Nature", "Biking", "Baby Stuff", "Dogs"],
        description: "Hey guys! I'm an Atlanta native who loves hiking/nature! I regularly give away old hiking and biking stuff so follow me to get some of that.",
        profilePicture: "https://via.placeholder.com/80x80",
    };
    
    // Mock posts data
    const posts: Post[] = [
        {
            id: 1,
            title: "TV to Give Away",
            body: "I have a TV I don't need anymore.",
            type: "gift",
            images: ["http://picsum.photos/id/0/400/300"],
            isActive: true,
            sender: {
                id: "user1",
                username: "Annette Black",
                avatar: "https://via.placeholder.com/40x40",
                kudos: 100,
            },
        },
        {
            id: 2,
            title: "Want my old bike?",
            body: "Giving away my old bike.",
            type: "gift",
            images: ["http://picsum.photos/id/1/400/301"],
            kudos: 5256,
            sender: {
                id: "user1",
                username: "Annette Black",
                avatar: "https://randomuser.me/api/portraits/women/44.jpg",
                kudos: 100,
            },
        },
        {
            id: 3,
            title: "Need new hiking poles",
            body: "Looking for hiking poles.",
            type: "request",
            kudos: 284,
            sender: {
                id: "user1",
                username: "Annette Black",
                avatar: "https://randomuser.me/api/portraits/women/44.jpg",
                kudos: 100,
            },
        },
    ];
    
    const getUserTitle = () => {
        if (user.kudos > 10000) {
            return "Questing Knight";
        } else if (user.kudos > 5000) {
            return "Pro";
        } else {
            return "Novice";
        }
    };

    const getUserFeats = (): Feat[] => {
        return [
            {
                location: "Denver",
                date: new Date(2023, 11, 1), // December
                placement: 2,
                description: "Most Kudos in Dec"
            },
            {
                location: "Denver",
                date: new Date(2023, 4, 1), // May
                placement: 10,
                description: "Most Kudos in May"
            },
            {
                location: "Denver",
                date: new Date(2024, 0, 1), // 2024
                placement: 18,
                description: "Most Kudos in 2024"
            },
        ];
    };

    return (
        <ScrollView style={styles.container}>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
                <Image source={{ uri: user.profilePicture }} style={styles.profilePicture} />
                <Text style={styles.userTitle}>{getUserTitle()}</Text>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userKudos}>{user.kudos.toLocaleString()} Kudos</Text>
                
                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.actionButton}>
                        <Text>👤</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Text>💬</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Text>📊</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Text>⚙️</Text>
                    </TouchableOpacity>
                </View>
                
                {/* User Description */}
                <Text style={styles.userDescription}>{user.description}</Text>
                
                {/* Interest Tags */}
                <View style={styles.interestContainer}>
                    {user.interests.map((interest, index) => (
                        <View key={index} style={styles.interestPill}>
                            <Text style={styles.interestText}>{interest}</Text>
                        </View>
                    ))}
                </View>
            </View>
            
            {/* Achievements Section */}
            <View style={styles.achievementsContainer}>
                {getUserFeats().map((feat, index) => (
                    <View key={index} style={styles.achievementCard}>
                        <Text style={styles.achievementLocation}>{feat.location}</Text>
                        <View style={styles.rankBadge}>
                            <Text style={styles.rankText}>
                                {feat.placement === 2 ? "2nd" : 
                                 feat.placement === 10 ? "10th" : `${feat.placement}`}
                            </Text>
                        </View>
                        <Text style={styles.achievementDescription}>{feat.description}</Text>
                    </View>
                ))}
            </View>
            
            {/* Posts Filter */}
            <View style={styles.filterContainer}>
                <TouchableOpacity 
                    style={[styles.filterOption, filter === 'all' && styles.filterSelected]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={styles.filterText}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.filterOption, filter === 'gift' && styles.filterSelected]}
                    onPress={() => setFilter('gift')}
                >
                    <Text style={styles.filterText}>Gifts</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.filterOption, filter === 'request' && styles.filterSelected]}
                    onPress={() => setFilter('request')}
                >
                    <Text style={styles.filterText}>ReQuests</Text>
                </TouchableOpacity>
            </View>
            
            {/* Posts Section */}
            <View style={styles.postsContainer}>
                {posts
                    .filter(post => filter === 'all' || post.type === filter)
                    .map(post => (
                        <PostCard key={post.id} post={post} />
                    ))
                }
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    profileHeader: {
        alignItems: "center",
        padding: 20,
    },
    profilePicture: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 5,
    },
    userTitle: {
        fontSize: 14,
        color: "#666",
        marginBottom: 5,
    },
    userName: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#2D3748",
        marginBottom: 5,
    },
    userKudos: {
        fontSize: 18,
        color: "#718096",
        marginBottom: 15,
    },
    actionButtons: {
        flexDirection: "row",
        marginBottom: 20,
        width: "80%",
        justifyContent: "space-between",
    },
    actionButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#E2E8F0",
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: 5,
    },
    actionIcon: {
        width: 24,
        height: 24,
    },
    userDescription: {
        fontSize: 16,
        color: "#4A5568",
        textAlign: "center",
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    interestContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        marginBottom: 20,
    },
    interestPill: {
        backgroundColor: "#E6FFEA",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        margin: 5,
    },
    interestText: {
        color: "#38A169",
        fontSize: 14,
    },
    achievementsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 15,
        marginBottom: 20,
    },
    achievementCard: {
        width: '30%',
        backgroundColor: "#EBF8FF",
        borderRadius: 10,
        padding: 10,
        alignItems: "center",
        position: "relative",
    },
    achievementLocation: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 5,
    },
    rankBadge: {
        position: "absolute",
        top: -10,
        right: -10,
        backgroundColor: "#000",
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: "center",
        alignItems: "center",
    },
    rankText: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 12,
    },
    achievementDescription: {
        fontSize: 12,
        textAlign: "center",
        color: "#4A5568",
    },
    filterContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 15,
    },
    filterOption: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    filterSelected: {
        borderBottomWidth: 2,
        borderBottomColor: "#3182CE",
    },
    filterText: {
        fontSize: 16,
        color: "#4A5568",
    },
    postsContainer: {
        paddingHorizontal: 15,
        marginBottom: 30,
    },
    postCard: {
        backgroundColor: "#FFF",
        borderRadius: 10,
        marginBottom: 15,
        padding: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        position: "relative",
    },
    postContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    postTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#2D3748",
        flex: 1,
    },
    tagPill: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 15,
    },
    tagDark: {
        backgroundColor: "#2D3748",
    },
    tagText: {
        color: "#FFF",
        fontSize: 12,
        fontWeight: "bold",
    },
    postImage: {
        width: "100%",
        height: 150,
        borderRadius: 8,
        marginBottom: 20,
    },
    kudosText: {
        position: "absolute",
        bottom: 10,
        right: 10,
        fontSize: 14,
        color: "#718096",
        marginTop: 10,
    },
    activeLabel: {
        position: "absolute",
        top: 10,
        right: 10,
        fontSize: 12,
        color: "#38A169",
    },
    noImageText: {
        fontSize: 16,
        color: "#718096",
        marginTop: 10,
    },
});

export default ProfilePage;